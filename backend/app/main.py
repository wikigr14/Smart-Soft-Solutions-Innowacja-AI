from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
from . import models, database, ai_service
from datetime import datetime
from fastapi.responses import RedirectResponse
from . import google_service
import json


# walidacja danych
# zapisanie nowej transkrypcji
class TranscriptCreate(BaseModel):
    filename: str
    full_text: str


class TranscriptResponse(TranscriptCreate):
    id: int
    created_at: datetime
    summary: Optional[str] = None

    class Config:
        from_attributes = True


# Schematy dla RAG
class ChatRequest(BaseModel):
    question: str
    transcript_id: Optional[int] = None


class ChatResponse(BaseModel):
    answer: str
    context_chunks: List[str]


# Inicjalizacja bazy i rozszerzenia pgvector przy starcie
def init_db():
    try:
        # rozszerzenia wektorowe
        with database.engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
        # tworzenie tabel na podstawie models.py
        models.Base.metadata.create_all(bind=database.engine)

        # USER DO TESTOW --------------

        db = database.SessionLocal()
        test_user = (
            db.query(models.User).filter(models.User.email == "test@elo.pl").first()
        )
        if not test_user:
            test_user = models.User(
                email="test@elo.pl",
                hashed_password="elo123",
            )
            db.add(test_user)
            db.commit()
        db.close()

        # -----------------------

        print("Database initialized successfully.")
    except Exception as e:
        print(f"Error initializing database: {e}")


init_db()

app = FastAPI(title="AI Transcriber API")

# KONFIGURACJA CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "Backend is running", "database": "connected"}


@app.get("/health")
def health_check(db: Session = Depends(database.get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def process_ai_chunks(transcript_id, full_text, db):
    # ai processing
    chunks = ai_service.chunk_text(full_text)
    print(f"tekst zostal podzielony na {len(chunks)} kawalkow")

    # wektoryacja i zapis chunkow
    for index, chunk_content in enumerate(chunks):
        vector = ai_service.get_embedding(chunk_content)
        if vector:
            db_chunk = models.TranscriptChunk(
                transcript_id=transcript_id,
                chunk_index=index,
                chunk_text=chunk_content,
                embedding=vector,
            )
            db.add(db_chunk)
    db.commit()


# ENDPOINTY
# zapisanie danych
@app.post("/transcripts/", response_model=TranscriptResponse)
def create_transcript(item: TranscriptCreate, db: Session = Depends(database.get_db)):
    # biere test usera
    user = db.query(models.User).filter(models.User.email == "test@elo.pl").first()
    if not user:
        raise HTTPException(status_code=500, detail="Test user not found")

    # tworzony wpis transkrypcji w bazie
    db_transcript = models.Transcript(
        filename=item.filename, full_text=item.full_text, user_id=user.id
    )

    # zapis w bazie
    db.add(db_transcript)
    db.commit()
    db.refresh(db_transcript)

    process_transcript_full(db_transcript.id, item.full_text, db)
    db.refresh(db_transcript)

    return db_transcript


# odczyt danych
@app.get("/transcripts/", response_model=List[TranscriptResponse])
def read_transcripts(db: Session = Depends(database.get_db)):
    # pobiera liste transkrypcji tylko dla test usera!!!
    user = db.query(models.User).filter(models.User.email == "test@elo.pl").first()
    if not user:
        return []
    return user.transcripts


# do przetwarzania i generowania podsumowan
def process_transcript_full(transcript_id, full_text, db: Session):
    # embedding
    process_ai_chunks(transcript_id, full_text, db)
    # generowanie podsumowania przez openrouter
    summary_text = ai_service.generate_summary(full_text)
    # test google calendar
    meeting_data = ai_service.extract_event_json(full_text)
    calendar_link = None
    if meeting_data:
        # pobieranie usera
        transcript = db.query(models.Transcript).filter(models.Transcript.id == transcript_id).first()
        user = transcript.owner
        # sprawdzenie czy user jest zalogowany do google
        if user.google_credentials:
            # casting cred_data na dict jesli jest stringiem
            cred_data = user.google_credentials
            if isinstance(cred_data, str):
                cred_data = json.loads(cred_data)
            link = google_service.create_calendar_event(cred_data, meeting_data)
            if link:
                calendar_link = link
                summary_text += f"\nUtwórz wydarzenie w kalendarzu: {calendar_link}"
    # aktualizacja w bazie
    db_transcript = db.query(models.Transcript).filter(models.Transcript.id == transcript_id).first()
    if db_transcript:
        db_transcript.summary = summary_text
        db.commit()
        db.refresh(db_transcript)


# upload pliku txt
@app.post("/upload/", response_model=TranscriptResponse)
async def upload_text_file(
        file: UploadFile = File(...), db: Session = Depends(database.get_db)
):
    # Pobieranie testowego usera
    user = db.query(models.User).filter(models.User.email == "test@elo.pl").first()
    if not user:
        raise HTTPException(status_code=500, detail="Test user not found")

    try:
        # Odczytywanie treści pliku txt
        content = await file.read()
        text_content = content.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Błąd odczytu pliku: {str(e)}")

    # Utworzenie wpisu w bazie
    db_transcript = models.Transcript(
        filename=file.filename, full_text=text_content, user_id=user.id
    )

    db.add(db_transcript)
    db.commit()
    db.refresh(db_transcript)

    process_transcript_full(db_transcript.id, text_content, db)
    db.refresh(db_transcript)

    return db_transcript


# Logika odczytu (RAG)
@app.post("/chat/", response_model=ChatResponse)
def ask_question(request: ChatRequest, db: Session = Depends(database.get_db)):
    # Wektoryzacja pytania
    query_vector = ai_service.get_embedding(request.question)

    if not query_vector:
        raise HTTPException(status_code=500, detail="Błąd wektoryzacji pytania")

    # Szukanie pasujacych fragmentow w bazie
    query = db.query(models.TranscriptChunk)

    if request.transcript_id:
        query = query.filter(models.TranscriptChunk.transcript_id == request.transcript_id)

    # Szukanie najwiekszego podobienstwa
    best_chunks = query.order_by(
        models.TranscriptChunk.embedding.cosine_distance(query_vector)
    ).limit(3).all()

    if not best_chunks:
        return ChatResponse(
            answer="Brak pasujących informacji w bazie.",
            context_chunks=[]
        )

    # Wyciąganie tekstu
    context_texts = [c.chunk_text for c in best_chunks]

    return ChatResponse(
        answer=f"Znalazlem {len(context_texts)} pasujace fragmenty.",
        context_chunks=context_texts
    )


# rzeczy do autoryzacji google

@app.get("/auth/login")
def login_google():
    # przekierowuje do logowania do google
    # http://localhost:8000/auth/login
    auth_url = google_service.get_auth_url()
    return {"auth_url": auth_url}


@app.get("/auth/callback")
def auth_callback(code: str, db: Session = Depends(database.get_db)):
    # odbiera kod od google i zapisuje tokeny dla usera (teraz tylko test_user)
    try:
        cred = google_service.get_credentials(code)
        # zapis tokenow do bazy (teraz tylko dla test user)
        cred_json = cred.to_json()
        user = db.query(models.User).filter(models.User.email == "test@elo.pl").first()
        if user:
            user.google_credentials = cred_json  # sqlalchemy powinien sam zmapowac
            db.commit()
            return {"status": "Logowanie pomyślne. Można zamknąć okno"}
        else:
            raise HTTPException(status_code=404, detail="Nie znaleziono użytkownika")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Błąd autoryzacji {str(e)}")
