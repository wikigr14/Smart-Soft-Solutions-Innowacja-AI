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
