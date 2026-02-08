from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import OpenAI
from . import config
import json
import re
from datetime import datetime

# inicjalizacja openroutera
client = OpenAI(
    base_url=config.OPENROUTER_BASE_URL,
    api_key=config.OPENROUTER_API_KEY,
)

# chyba podmianka modelu bo cienko z kontekstami
# ten slabo pod katem jezyka polskiego
# model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# podmianka na multilingual model
model = SentenceTransformer(
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)


def chunk_text(text, chunk_size=500, chunk_overlap=50):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return text_splitter.split_text(text)


def get_embedding(text):
    try:
        vector = model.encode(text).tolist()
        return vector
    except Exception as e:
        print(f"blad wektoryzacji {e}")
        return []


def generate_answer_from_context(question: str, context_chunks: list) -> str:
    if not context_chunks:
        return "Nie znaleziono informacji na ten temat w twojej historii."

    context_chunks_merged = "\n".join(context_chunks)

    prompt = (
        "Jesteś asystentem, który odpowiada na pytania WYŁĄCZNIE na podstawie dostarczonego kontekstu.\n"
        "Kontekst to fragmenty transkrypcji spotkań użytkownika.\n"
        "Trzymaj się kurczowo tych zasad:\n"
        "1. Odpowiadaj krótko i konkretnie.\n"
        "2. Jeśli odpowiedź nie znajduje się w kontekście, napisz: 'Nie znaleziono informacji na ten temat w twojej historii.'\n"
        "3. Nie zmyślaj, trzymaj się twardych faktów z plików.\n"
        "4. Używaj języka polskiego."
    )

    user_prompt = f"Pytanie: {question}\nKontekst: {context_chunks_merged}"

    try:
        response = client.chat.completions.create(
            # model="meta-llama/llama-3.3-70b-instruct:free",
            # model="openai/gpt-oss-120b:free",
            # model="meta-llama/llama-3.2-3b-instruct:free",
            model="stepfun/step-3.5-flash:free",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Błąd generowania odpowiedzi RAG: {e}")
        return "Wystąpił błąd podczas generowania odpowiedzi."


def generate_summary(text: str) -> str:
    # funkcja ma za zadanie wyslac tekst do openroutera zeby ten wygenerowal podsumowanie
    try:
        prompt = f"Jesteś asystentem AI. Przeanalizuj poniższą transkrypcję spotkania. Stwórz zwięzłe podsumowanie tego spotkania. Jeśli to możliwe możesz rozbić to podsumowanie na punkty. Jeśli w poniższym tekście jest poruszony temat i data jakiegoś spotkania to wypisz je jeszcze raz na samym końcu w formacie:\nSpotkanie: DATA - Temat spotkania (lub jeśli jego temat nie został podany to poprostu Spotkanie).\nTreść transkrypcji:\n{text}"
        # zapytanie wysylane do openroutera
        response = client.chat.completions.create(
            # model="meta-llama/llama-3.3-70b-instruct:free",
            # model="openai/gpt-oss-120b:free",
            model="stepfun/step-3.5-flash:free",
            # zeby zmienic skopiowac link do innego modelu z https://openrouter.ai/models !!!WYBRAC DARMOWY MODEL!!!
            messages=[
                {"role": "system", "content": "Jesteś asystentem biurowym AI."},
                {"role": "user", "content": prompt},
            ],
        )
        # zwrocenie odpowiedz wygenerowanej przez ai
        return response.choices[0].message.content
    except Exception as e:
        print(f"Błąd generowania podsumowania: {e}")
        return "Nie udało się wygenerować podsumowania spotkania."


def extract_event_json(text: str):
    # analizuje tekst w celu znalezienia informacji o spotkaniu i zwrocenia jej jako json
    try:
        # pobranie dzisiejszej daty dla spotkan ktore odbeda sie np 'za tydzien'
        current_date = datetime.now().strftime("%Y-%m-%d (%A)")
        # prompt do AI zeby dal info o spotkaniu w formacie json
        # !!RACZEJ!! NIE RUSZAC
        # prompt = (
        #     "Przeanalizuj poniższy tekst. Jeśli jest w nim informacja o spotkaniu, zwróć kod JSON.\n"
        #     "Jeśli NIE podano godziny, tylko samą datę to użyj 'start_date' i 'end_date' w formacie (YYYY-MM-DD) i zaznacz 'is_all_day': true.\n"
        #     "Jeśli podano godzinę to użyj 'start_time' i 'end_time' w formacie (YYYY-MM-DDTHH:MM:SS).\n"
        #     f"Dzisiaj jest: {current_date}. To WAŻNA informacja jeśli mowa jest, że spotkanie odbędzie się np. za tydzień.\n"
        #     "Format JSON:\n"
        #     "{\n"
        #     ' "summary": "Temat spotkania",\n'
        #     ' "description": "Krótki opis",\n'
        #     ' "is_all_day": "true/false",\n"'
        #     ' "start_time": YYYY-MM-DDTHH:MM:SS",\n'
        #     ' "end_time": YYYY-MM-DDTHH:MM:SS",\n'
        #     ' "start_date": "YYYY-MM-DD",\n'
        #     ' "end_date": "YYYY-MM-DD"\n'
        #     "}\n"
        #     "Jeśli nie ma daty, zwróć puste nawiasy {}.\n"
        #     "Jeśli nie podano TYLKO czasu zakończenia/trwania spotkania to załóż, że trwa ono 1 godzinę.\n"
        #     "Data musi być w formacie ISO 8601.\n"
        #     f"Tekst do analizy:\n{text}"
        # )
        prompt = (
            "Przeanalizuj poniższy tekst i znajdź WSZYSTKIE wzmianki o planowanych spotkaniach.\n"
            'Zwróć wynik jako TABLICĘ JSON (lista obiektów), np.: [{"summary": ...}, {"summary": ...}].\n'
            "Nawet jeśli jest tylko jedno spotkanie, zwróć je w tablicy [].\n"
            "Jeśli NIE podano godziny, tylko samą datę to użyj 'start_date' i 'end_date' w formacie (YYYY-MM-DD) i zaznacz 'is_all_day': true.\n"
            "Jeśli podano godzinę to użyj 'start_time' i 'end_time' w formacie (YYYY-MM-DDTHH:MM:SS).\n"
            f"Dzisiaj jest: {current_date}. Oblicz daty relatywne (np. 'przyszła środa').\n"
            "Wymagany format JSON:\n"
            "[\n"
            "  {\n"
            '    "summary": "Tytuł",\n'
            '    "description": "Opis",\n'
            '    "is_all_day": false,\n'
            '    "start_time": "YYYY-MM-DDTHH:MM:SS",\n'
            '    "end_time": "YYYY-MM-DDTHH:MM:SS"\n'
            '    "start_date": "YYYY-MM-DD",\n'
            '    "end_date": "YYYY-MM-DD"\n'
            "  }\n"
            "]\n"
            "Jeśli nie ma spotkań, zwróć pustą tablicę [].\n"
            "Jeśli nie podano TYLKO czasu zakończenia/trwania spotkania to załóż, że trwa ono 1 godzinę.\n"
            "Data musi być w formacie ISO 8601.\n"
            "Używaj języka polskiego."
            f"Tekst do analizy:\n{text}"
        )
        # zapytanie wysylane do modelu
        response = client.chat.completions.create(
            # model="meta-llama/llama-3.3-70b-instruct:free",
            model="openai/gpt-oss-120b:free",
            # model="stepfun/step-3.5-flash:free",
            # zeby zmienic skopiowac link do innego modelu z https://openrouter.ai/models !!!WYBRAC DARMOWY MODEL!!!
            messages=[
                {
                    "role": "system",
                    "content": "Jesteś asystentem do API. Zwracasz TYLKO czysty kod JSON.",
                },
                {"role": "user", "content": prompt},
            ],
        )
        content = response.choices[0].message.content

        # podglad odpowiedzi modelu w logach
        print(f"DEBUG AI RESPONSE:\n{content}")

        # w razie gdyby model oszukal z outputem i oprocz samego kodu json zwrocil tez jakies swoje mysli
        json_match = re.search(r"\[.*\]", content, re.DOTALL)
        if json_match:
            # konwersja z json na slownik
            event_data = json.loads(json_match.group(0))

            if isinstance(event_data, list):
                valid_events = []
                for event in event_data:
                    # sprawdzenie czy spoktanie zawiera dane o rozpoczeciu
                    if "start_time" in event or "start_date" in event:
                        valid_events.append(event)

                return valid_events if valid_events else None

        return None

    except Exception as e:
        print(f"Błąd ekstraktowania danych o spotkaniu w formacie JSON: {e}")
        return None
