import os
from dotenv import load_dotenv

# Wczytaj zmienne z pliku .env (jeśli istnieje lokalnie)
load_dotenv()

# Pobierz adres bazy danych. Jeśli go nie ma, zgłoś błąd.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set. Check your .env file.")

# Klucz do OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
