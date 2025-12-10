# Używamy lekkiej wersji Pythona
FROM python:3.11

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie listy bibliotek i instalacja
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiowanie kodu aplikacji
COPY . .

# Uruchomienie serwera (na porcie 8000 z opcją reload)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]