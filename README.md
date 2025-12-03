# AI – Interfejs z bazą RAG, do której użytkownicy wrzucają nagranie, a system robi podsumowanie i dodaje eventy do kalendarza

## Opis zadania

Aplikacja (web + ewentualnie mobilna), która:

1. Przyjmuje nagrania audio (np. z zebrania, rozmowy),
2. Transkrybuje je do tekstu,
3. Korzysta z modelu LLM + RAG do wygenerowania:
    *   podsumowania,
    *   listy zadań / decyzji,
    *   propozycji wydarzeń (spotkań) do kalendarza,
4. Pozwala zatwierdzić i wysłać eventy do kalendarza (Google / Outlook).

---

## Zakres funkcjonalny

*   **Upload audio** (lub nagrywanie bezpośrednio z przeglądarki / aplikacji mobilnej).
*   **Transkrypcja** (ASR – Automatic Speech Recognition).
*   **Analiza treści i RAG** (pobieranie kontekstu z wektorowej bazy wiedzy – np. wcześniejsze spotkania, dokumenty).
*   **Generowanie podsumowania i listy eventów.**
*   **Integracja z kalendarzem** (Google Calendar / Microsoft 365).
*   **Panel historii nagrań + podsumowań.**

---

## Stack Technologiczny

| Komponent | Technologia |
| :--- | :--- |
| **Backend** | Python + FastAPI |
| **Transkrypcja** | Whisper (OpenAI API) |
| **Podsumowania / AI** | OpenRouter.ai (model do ustalenia)|
| **Baza danych** | PostgreSQL + pgvector |
| **Frontend** | React |
| **Integracja** | Google Calendar API |

---

## Przygotowanie środowiska

git clone https://github.com/wikigr14/Smart-Soft-Solutions-Innowacja-AI.git
cd Smart-Soft-Solutions-Innowacja-AI

Utworzyć plik .env w głównym katalogu projektu

```env
OPENAI_API_KEY=sk-....
DATABASE_URL=postgresql://appuser:sekret@db:5432/transcriber_db
POSTGRES_USER=appuser
POSTGRES_PASSWORD=sekret
POSTGRES_DB=transcriber_db
```

#### Uruchamianie

**Terminal 1 (Backend + Baza):**
docker-compose up --build

**Terminal 2 (Frontend):**
cd frontend
npm install
npm run dev
