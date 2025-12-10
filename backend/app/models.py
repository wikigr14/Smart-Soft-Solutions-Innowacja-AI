from sqlalchemy import Column, Integer, String, Text, DateTime, func
from pgvector.sqlalchemy import Vector
from .database import Base

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True, nullable=True)

    # Pełny tekst transkrypcji
    full_text = Column(Text, nullable=False)

    # Podsumowanie wygenerowane przez AI
    summary = Column(Text, nullable=True)

    # Wektor do wyszukiwania (narazie zostawiam 1536 ale to do sprawdzenia z HuggingFace i odpowiednim modelem!!!)
    embedding = Column(Vector(1536), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
