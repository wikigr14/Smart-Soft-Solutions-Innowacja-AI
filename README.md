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

## Taki zestaw

| Komponent | Technologia |
| :--- | :--- |
| **Backend** | Python + FastAPI |
| **Transkrypcja** | Whisper (OpenAI API) |
| **Podsumowania / AI** | OpenAI API (LLM) |
| **Baza danych** | PostgreSQL + pgvector |
| **Frontend** | React |
| **Integracja** | Google Calendar API |

---

## Aktualne zadania

1. Do czwartku zbudować projekt oraz ogarnąć środowisko





git clone https://github.com/wikigr14/Smart-Soft-Solutions-Innowacja-AI.git
cd Smart-Soft-Solutions-Innowacja-AI

#### Krok C: Konfiguracja sekretów (`.env`)
To kluczowy moment. Pliku `.env` nie ma na GitHubie (dla bezpieczeństwa). Twój kolega musi:
1.  Utworzyć nowy plik o nazwie `.env` w głównym folderze.
2.  Wkleić do niego treść, którą mu wyślesz (Twoje klucze API i konfigurację bazy):

```env
OPENAI_API_KEY=sk-....
DATABASE_URL=postgresql://appuser:sekret@db:5432/transcriber_db
POSTGRES_USER=appuser
POSTGRES_PASSWORD=sekret
POSTGRES_DB=transcriber_db
... (reszta Twoich zmiennych)

#### Krok D: Uruchomienie (Codzienna praca)

Na Windowsie używa się `docker-compose` (zamiast `podman-compose`).

**Terminal 1 (Backend + Baza):**
```powershell
docker-compose up --build
*(To postawi bazę i backend na localhost:8000)*

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm install  # Tylko za pierwszym razem
npm run dev
*(To uruchomi Reacta na localhost:5173)*

I to wszystko! Projekt będzie działał na Windowsie identycznie jak u Ciebie na Fedorze.
