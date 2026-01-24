from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from . import models, database, ai_service, google_service, auth
from datetime import datetime
import json


class UserCreate(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# walidacja danych
# zapisanie nowej transkrypcji
class TranscriptCreate(BaseModel):
    filename: str
    full_text: str


class TranscriptResponse(TranscriptCreate):
    id: int
    filename: str
    created_at: datetime
    summary: Optional[str] = None
    calendar_events: Optional[Dict[str, Any]] = None  # json z evenetem

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


@app.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Użytkownik o podanym adresie Email już istnieje")
    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Niepoprawny email lub hasło")
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me")
def read_user_me(current_user: models.User = Depends(auth.get_current_user)):
    # zwraca info o zalogowanym userze (email, i czy konto google jest podpiete)
    return {
        "email": current_user.email,
        "is_google_connected": current_user.google_credentials is not None
    }


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
def create_transcript(item: TranscriptCreate, db: Session = Depends(database.get_db),
                      current_user: models.User = Depends(auth.get_current_user)):
    # tworzony wpis transkrypcji w bazie
    db_transcript = models.Transcript(
        filename=item.filename, full_text=item.full_text, user_id=current_user.id
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
def read_transcripts(db: Session = Depends(database.get_db),
                     current_user: models.User = Depends(auth.get_current_user)):
    return current_user.transcripts


# do przetwarzania i generowania podsumowan
def process_transcript_full(transcript_id, full_text, db: Session):
    # embedding
    process_ai_chunks(transcript_id, full_text, db)
    # generowanie podsumowania przez openrouter
    summary_text = ai_service.generate_summary(full_text)
    # test google calendar
    meeting_data = ai_service.extract_event_json(full_text)
    db_transcript = db.query(models.Transcript).filter(models.Transcript.id == transcript_id).first()
    if db_transcript:
        db_transcript.summary = summary_text
        if meeting_data:
            db_transcript.calendar_events = meeting_data
        db.commit()
        db.refresh(db_transcript)


# upload pliku txt
@app.post("/upload/", response_model=TranscriptResponse)
async def upload_text_file(
        file: UploadFile = File(...), db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    try:
        # Odczytywanie treści pliku txt
        content = await file.read()
        text_content = content.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Błąd odczytu pliku: {str(e)}")

    # Utworzenie wpisu w bazie dla aktualnie zalogowanego usera
    db_transcript = models.Transcript(
        filename=file.filename, full_text=text_content, user_id=current_user.id
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
@app.get("/auth/google/url")
def get_google_auth_url(current_user: models.User = Depends(auth.get_current_user)):
    return {"url": google_service.get_auth_url()}


@app.get("/auth/callback")
def auth_callback(code: str, db: Session = Depends(database.get_db)):
    # przekierowuje na frontend
    return RedirectResponse(f"http://localhost:5174?google_code={code}")


@app.post("/auth/google/connect")
def connect_google_account(body: dict, db: Session = Depends(database.get_db),
                           current_user: models.User = Depends(auth.get_current_user)):
    code = body.get("code")
    cred = google_service.get_credentials(code)
    current_user.google_credentials = cred.to_json()
    db.commit()
    return {"status": "Connected"}


@app.post("/transcripts/{transcript_id}/create_event")
def create_event_in_google(transcript_id: int, db: Session = Depends(database.get_db),
                           current_user: models.User = Depends(auth.get_current_user)):
    transcript = db.query(models.Transcript).filter(models.Transcript.id == transcript_id,
                                                    models.Transcript.user_id == current_user.id).first()
    if not transcript or not transcript.calendar_events:
        raise HTTPException(status_code=404, detail="Nie wykryto spotkania do dodania")
    if not current_user.google_credentials:
        raise HTTPException(status_code=400, detail="Nie połączono z kontem Google")
    cred = json.loads(current_user.google_credentials) if isinstance(current_user.google_credentials,
                                                                     str) else current_user.google_credentials
    link = google_service.create_calendar_event(cred, transcript.calendar_events)
    if link:
        return {"link": link}
    else:
        raise HTTPException(status_code=500, detail="Błąd działania Google Calendar API")
