from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import OpenAI
from . import config

# inicjalizacja openroutera
client = OpenAI(
    base_url=config.OPENROUTER_BASE_URL,
    api_key=config.OPENROUTER_API_KEY,
)

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


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


def generate_summary(text: str) -> str:
    # funkcja ma za zadanie wyslac tekst do openroutera zeby ten wygenerowal podsumowanie
    try:
        prompt = f"Jesteś asystentem AI. Przeanalizuj poniższą transkrypcję spotkania. Stwórz zwięzłe podsumowanie tego spotkania. Jeśli to możliwe możesz rozbić to podsumowanie na punkty. Jeśli w poniższym tekście jest poruszony temat i data jakiegoś spotkania to zaznacz je w jakiś sposób.\nTreść transkrypcji:\n{text}"
        response = client.chat.completions.create(
            model="meta-llama/llama-3.3-70b-instruct:free",
            # Deprecating 6 lutego 2026 zeby zmienic skopiowac link do innego modelu z https://openrouter.ai/models !!!WYBRAC DARMOWY MODEL!!!
            messages=[
                {"role": "system", "content": "Jesteś asystentem biurowym AI."},
                {"role": "user", "content": prompt}
            ])

        return response.choices[0].message.content
    except Exception as e:
        print(f"Błąd generowania podsumowania: {e}")
        return "Nie udało się wygenerować podsumowania spotkania."
