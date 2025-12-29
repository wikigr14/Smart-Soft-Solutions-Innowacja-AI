from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    func,
    ForeignKey,
    Boolean,
    JSON,
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # token dostepu do kalendarza
    google_credentials = Column(JSON, nullable=True)
    transcripts = relationship("Transcript", back_populates="owner")


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # kto wrzucil transkrypcje
    owner = relationship("User", back_populates="transcripts")

    filename = Column(String, index=True, nullable=True)

    # Pełny tekst transkrypcji
    full_text = Column(Text, nullable=False)

    # Podsumowanie wygenerowane przez AI
    summary = Column(Text, nullable=True)

    # lista zadan
    todo_list = Column(Text, nullable=True)

    # wydarzenia do kalendarza (OAuth2)
    calendar_events = Column(JSON, nullable=True)

    # embedding = Column(Vector(1536), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chunks = relationship(
        "TranscriptChunk", back_populates="transcript", cascade="all, delete-orphan"
    )


class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"

    id = Column(Integer, primary_key=True, index=True)
    transcript_id = Column(Integer, ForeignKey("transcripts.id"), nullable=False)

    chunk_index = Column(Integer)
    chunk_text = Column(Text, nullable=False)

    # wymiar 384 dla all-MiniLM-L6-v2
    embedding = Column(Vector(384), nullable=True)

    transcript = relationship("Transcript", back_populates="chunks")
