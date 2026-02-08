# AI Transcriber – Inteligentny asystent spotkań (RAG + Kalendarz)

Aplikacja webowa typu RAG, która analizuje pliki tekstowe z transkrypcjami spotkań, generuje podsumowania, wykrywa daty wydarzeń i pozwala na interakcję z treścią poprzez inteligentny czat.

System posiada pełną integrację z Google Calendar oraz system kont użytkowników z izolacją danych.

---

## Główne funkcjonalności

## 1. **Analiza i podsumowanie**

- Upload plików tekstowych (`.txt`) z transkrypcją.
- Automatyczne generowanie zwięzłych podsumowań spotkań.
- Inteligentne wykrywanie dat i tematów spotkań.

## 2. **Integracja z Google Calendar**

- Bezpieczne logowanie przez **Google OAuth2**.
- Automatyczne wykrywanie wydarzeń w tekście.
- Dodawanie spotkań do prywatnego kalendarza Google jednym kliknięciem.

## 3. **Czat**

- Wbudowany asystent AI, który odpowiada na pytania wyłącznie na podstawie Twoich plików.
- Możliwość zadawania pytań typu: "Kiedy mam egzamin z przedmiotu x?", "Co ustaliliśmy w sprawie budżetu?".
- Wykorzystanie bazy wektorowej (pgvector) do wyszukiwania kontekstowego.
- Użytkownik ma dostęp tylko do własnych danych.

---

## Stack Technologiczny

| Komponent          | Technologia                                                   |
| :----------------- | :------------------------------------------------------------ |
| **Infrastruktura** | Docker & Docker Compose                                       |
| **Backend**        | Python 3.11 + FastAPI                                         |
| **Baza danych**    | PostgreSQL + pgvector (Wektoryzacja danych)                   |
| **Frontend**       | React + Vite + Material UI                                    |
| **AI (LLM)**       | OpenRouter.ai                                                 |
| **Embeddingi**     | Sentence-Transformers (paraphrase-multilingual-MiniLM-L12-v2) |
| **Integracje**     | Google Calendar API (OAuth 2.0)                               |

---

## Instalacja i uruchomienie

Projekt jest w pełni skonteneryzowany. Wymaga jedynie zainstalowanego **Dockera**.

### 1. Pobranie repozytorium

```
git clone https://github.com/wikigr14/Smart-Soft-Solutions-Innowacja-AI.git
cd Smart-Soft-Solutions-Innowacja-AI
```

### 2. Konfiguracja pliku .env

```
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# --- GOOGLE CALENDAR ---
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:8000/auth/callback

# --- BAZA DANYCH (Lokalna) ---
POSTGRES_USER=appuser
POSTGRES_PASSWORD=password
POSTGRES_DB=transcriber_db
DATABASE_URL=postgresql://appuser:password@db:5432/transcriber_db

#AUTHORIZATION CONFIG
AUTH_KEY= # wygeneruj losowy klucz (poleceniem: openssl rand -hex 32)
AUTH_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_TIME_MINUTES=60
```

### 3. Uruchomienie aplikacji

```
docker-compose up --build
```

Aplikacja będzie dostępna pod adresem: http://localhost:5174

## Obsługa

**1. Rejestracja:** Utwórz konto w aplikacji.

**2. Upload:** Wgraj odpowiedni plik .txt z transkrypcją spotkania.

**3. Analiza:** System automatycznie wygeneruje podsumowanie i wykryje daty.

**4. Czat:** Rozwiń panel "Zapytaj AI" i zadaj pytanie dotyczące treści wgranych plików.

**5. Kalendarz:** Kliknij "Połącz z Google", a następnie przy wykrytych spotkaniach użyj przycisku "Dodaj do kalendarza".
