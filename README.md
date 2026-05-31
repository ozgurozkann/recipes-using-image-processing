# Recipes-using-image-processing

## MVP (giriş/kayıt + tarif öneri/liste + favori + dummy görüntü servisi)

Klasör: `mvp/`

Kurulum:

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r mvp\requirements.txt
```

Çalıştırma:

```powershell
uvicorn mvp.backend.main:app --reload
```

Arayüz: `http://127.0.0.1:8000/`

## Gerçek Proje (backend + React frontend)

Backend: `backend/` (FastAPI + SQLAlchemy + JWT)

Kurulum:

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r backend\requirements.txt
copy backend\.env.example backend\.env
```

Çalıştırma:

```powershell
uvicorn backend.app.main:app --reload
```

Swagger: `http://127.0.0.1:8000/docs`

Seed kullanıcı:
- Admin: `admin@example.com` / `admin1234`

Notlar:
- Dev’de varsayılan DB: SQLite (`backend/.env` içindeki `DATABASE_URL`).
- Model entegrasyonu için modüler servis: `backend/app/ml/image_recognition_service.py` (dummy veya Keras).

Görüntü modelini (mevcut `vegetable-classification/`) kullanmak için:
- `backend/.env` içinde `IMAGE_RECOGNITION_MODE=keras` yap
- Gerekirse `KERAS_MODEL_PATH` ve `KERAS_LABELS_PATH` yollarını ayarla
- Bağımlılıklar: `pip install tensorflow numpy pillow`

Frontend (React + Vite): `frontend/`

```powershell
cd frontend
npm install
npm run dev
```

UI: `http://127.0.0.1:5173/` (proxy ile backend’e bağlanır)
