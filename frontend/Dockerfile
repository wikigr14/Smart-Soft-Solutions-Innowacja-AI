# frontend/Dockerfile

# Używamy lekkiego obrazu z Node.js
FROM node:22-alpine

# Ustawiamy katalog roboczy w kontenerze
WORKDIR /app

# Kopiujemy pliki konfiguracyjne (żeby Docker wiedział co instalować)
COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm \
    npm install

# Kopiujemy resztę kodu
COPY . .

# Otwieramy port 5174 (standardowy dla Vite)
EXPOSE 5174

# Uruchamiamy serwer developerski z flagą --host, żeby był widoczny z Windowsa
CMD ["npm", "run", "dev", "--", "--host"]