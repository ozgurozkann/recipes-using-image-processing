# Docker ile Calistirma

Bu kurulum Windows ve macOS makinelerde ayni komutlarla calismak icin hazirlandi.

## Gereksinim

- Docker Desktop
- Git

## Ilk Kurulum

macOS veya Linux terminal:

```bash
cp .env.docker.example .env
docker compose up -d --build
```

Windows PowerShell:

```powershell
Copy-Item .env.docker.example .env
docker compose up -d --build
```

## Adresler

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- MySQL: localhost:3307

Docker compose `db` adinda bir MySQL 8 container'i baslatir. Backend container
icinden MySQL'e `db:3306` adresiyle baglanir.

## Yararlı Komutlar

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
docker compose down
```

## Port Degistirme

Bir bilgisayarda `5173`, `8000` veya `3306` portlari doluysa `.env` dosyasinda
su degerleri degistirin:

```env
FRONTEND_PORT=5174
BACKEND_PORT=8001
MYSQL_PORT=3307
```

MySQL sifresini veya veritabani adini degistirmek icin:

```env
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=recipes_db
```

## Kalici Veriler

- Veritabani verileri `mysql_data` Docker volume icinde saklanir.
- Yuklenen dosyalar `backend_uploads` Docker volume icinde saklanir.
- `backend/seed.sql` ilk MySQL kurulumunda otomatik yuklenir. `mysql_data`
  volume zaten varsa seed tekrar calismaz.
- Tum Docker verisini silip seed'i bastan yuklemek icin:

```bash
docker compose down -v
docker compose up -d --build
```

## Keras Model Modu

Varsayilan ayar `IMAGE_RECOGNITION_MODE=dummy`; model gerekmez.

Gercek modelle calismak icin `.env` icinde:

```env
IMAGE_RECOGNITION_MODE=keras
KERAS_MODEL_PATH=/app/vegetable-classification/vegetable_model.keras
KERAS_LABELS_PATH=/app/vegetable-classification/labels.txt
```
