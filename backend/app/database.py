from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import DATABASE_URL

# SQLAlchemy domyślnie używa sterownika psycopg2.
# Ten fragment upewnia się, że URL jest poprawny.
SQLALCHEMY_DATABASE_URL = DATABASE_URL
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Tworzenie silnika bazy danych
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Tworzenie fabryki sesji
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Baza dla modeli
Base = declarative_base()

# Funkcja pomocnicza do pobierania sesji DB (Dependency Injection)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
