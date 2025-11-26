# --- FAZA 1: BUDOWANIE (Instalacja zależności) ---
FROM python:3.11-slim as builder

# Ustawienie katalogu roboczego wewnątrz kontenera
WORKDIR /app

# Zapobieganie buforowaniu standardowego wyjścia Pythona
ENV PYTHONUNBUFFERED 1

# Kopiowanie pliku zależności i instalacja
COPY requirements.txt .

# Instalacja wszystkich bibliotek
RUN pip install --no-cache-dir -r requirements.txt


# --- FAZA 2: URUCHAMIANIE ---
FROM builder as final

# Kopiowanie WSZYSTKIEJ zawartości z katalogu 'backend' (w tym folderu 'app')
# do katalogu '/app' w kontenerze.
COPY . .

# Polecenie startowe serwera Uvicorn
# Zakładamy, że dzięki naprawie wolumenu (:Z w docker-compose), pliki będą widoczne.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
