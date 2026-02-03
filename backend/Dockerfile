# Używamy lekkiej wersji Pythona
FROM python:3.11

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie listy bibliotek i instalacja
COPY requirements.txt .

# torch sama wersja cpu bez nvidi bo i tak niepotrzebna a troche wazy
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install torch --index-url https://download.pytorch.org/whl/cpu

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Kopiowanie kodu aplikacji
COPY . .

# Uruchomienie serwera (na porcie 8000 z opcją reload)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]