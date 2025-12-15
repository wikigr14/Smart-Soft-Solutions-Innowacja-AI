from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
from . import models, database
from datetime import datetime


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

# --- KONFIGURACJA CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
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


# zapisanie danych
@app.post("/transcripts/", response_model=TranscriptResponse)
def create_transcript(item: TranscriptCreate, db: Session = Depends(database.get_db)):
    # biere test usera
    user = db.query(models.User).filter(models.User.email == "test@elo.pl").first()
    if not user:
        raise HTTPException(status_code=500, detail="Test user not found")

    # tworzony wpis w bazie
    db_transcript = models.Transcript(
        filename=item.filename, full_text=item.full_text, user_id=user.id
    )

    # zapis w bazie
    db.add(db_transcript)
    db.commit()
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


@app.post("/upload/", response_model=TranscriptResponse)
async def upload_text_file(
    file: UploadFile = File(...), 
    db: Session = Depends(database.get_db)
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
        filename=file.filename,
        full_text=text_content,
        user_id=user.id
    )

    db.add(db_transcript)
    db.commit()
    db.refresh(db_transcript)

    return db_transcript
