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
2. Zaprojektowanie schematu bazy. Macie dowolność odnośnie tabeli, ale zróbcie to w miarę przemyślany sposób i dobrze byłoby, żeby ogarnąć to w jakiejś cywilizowanej postaci graficznej
