import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set. Check your .env file.")

# Konfiguracja OpenRouter / AI
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
# Domyślny base URL dla OpenRoutera
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# Konfiguracja dla Google Calendar API
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CALENDAR_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CALENDAR_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_CALENDAR_REDIRECT_URI")

# Konfiguracja dla logowania/rejestracji, tokenow uzytkownika i sesji
AUTH_KEY = os.getenv("AUTH_KEY")
AUTH_ALGORITHM = os.getenv("AUTH_ALGORITHM")
ACCESS_TOKEN_EXPIRE_TIME_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_TIME_MINUTES", 60))
