# AI Transcriber – Inteligentny asystent spotkań (RAG + Kalendarz)

Aplikacja webowa, która analizuje treść spotkań (transkrypcje), tworzy podsumowania, wyciąga listę zadań i automatycznie proponuje wydarzenia do kalendarza Google.

## Opis zadania

Aplikacja web, która:

1. Obecnie zakładamy, że posiadamy gotową transkrypcję ,
2. Korzysta z modelu LLM + RAG do wygenerowania:
    *   podsumowania,
    *   listy zadań / decyzji,
    *   propozycji wydarzeń (spotkań) do kalendarza,
3. Pozwala zatwierdzić i wysłać eventy do kalendarza (Google / Outlook).

---

## Zakres funkcjonalny

*   **Upload audio / Transkrypcja** (feature opcjonalny).
*   **Analiza treści i RAG** (pobieranie kontekstu z wektorowej bazy wiedzy – np. wcześniejsze spotkania, dokumenty).
*   **Generowanie podsumowania i listy eventów.**
*   **Integracja z kalendarzem** (Google Calendar).
*   **Panel historii nagrań + podsumowań.**

---

## Stack Technologiczny

| Komponent | Technologia |
| :--- | :--- |
| **Infrastruktura** | Docker & Docker Compose |
| **Backend** | Python 3.11 + FastAPI |
| **Baza danych** | PostgreSQL + pgvector (Wektoryzacja danych) |
| **Frontend** | React + Vite + Material UI |
| **AI (LLM)** | OpenRouter.ai |
| **Embeddingi** | HuggingFace |
| **Integracje** | Google Calendar API |

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
# --- AI CONFIG ---
OPENROUTER_API_KEY=tutaj_wklej_swoj_klucz
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# --- GOOGLE CALENDAR ---
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=

# --- BAZA DANYCH (Lokalna) ---
POSTGRES_USER=appuser
POSTGRES_PASSWORD=sekret
POSTGRES_DB=transcriber_db
DATABASE_URL=postgresql://appuser:sekret@db:5432/transcriber_db
```

### 3. Uruchomienie aplikacji
```
docker-compose up --build
```