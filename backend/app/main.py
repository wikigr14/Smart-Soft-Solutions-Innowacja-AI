from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # <--- NOWY IMPORT
from sqlalchemy.orm import Session
from sqlalchemy import text
from . import models, database

# Inicjalizacja tabel w bazie danych
def init_db():
    try:
        with database.engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
        models.Base.metadata.create_all(bind=database.engine)
        print("✅ Baza danych zainicjalizowana pomyślnie.")
    except Exception as e:
        print(f"❌ Błąd inicjalizacji bazy danych: {e}")

init_db()

app = FastAPI(title="AI Transcriber API")

# --- KONFIGURACJA CORS (To pozwala Reactowi rozmawiać z API) ---
origins = [
    "http://localhost:5173",  # Port domyślny Vite/React
    "http://localhost:3000",  # Alternatywny port Reacta
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     # Pozwól tylko tym adresom
    allow_credentials=True,
    allow_methods=["*"],       # Pozwól na wszystkie metody (GET, POST, etc.)
    allow_headers=["*"],       # Pozwól na wszystkie nagłówki
)
# -------------------------------------------------------------

@app.get("/")
def read_root():
    return {"status": "Backend is running", "database": "connected"}

@app.get("/health")
def health_check(db: Session = Depends(database.get_db)):
    """Sprawdza połączenie z bazą danych."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db_connectivity": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")
