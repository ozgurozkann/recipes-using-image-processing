# Recipes — Görüntü İşlemeli Yemek Tarifi Öneri Sistemi

Fotoğraf yükleyerek veya manuel malzeme seçerek kişiselleştirilmiş yemek tarifi önerileri sunan web uygulaması.

---

## Özellikler

| Alan | Detay |
|---|---|
| **Kullanıcı** | Kayıt, giriş (JWT), profil |
| **Fotoğraf** | Görüntü yükleme → malzeme tespiti → tarif önerisi |
| **Manuel Seçim** | Kategori bazlı malzeme seçimi + miktar/birim girişi |
| **Öneri Algoritması** | Eşleşme %70 · Eksik azlığı %15 · Favori %10 · Kaydet %5 |
| **Tarifler** | CRUD, görsel, zorluk, süre, porsiyon, kategori |
| **Favori & Kaydet** | Kullanıcı başına favori ve kaydedilen tarifler |
| **Admin Paneli** | Tarif onay/red, malzeme ve kategori yönetimi |
| **Görüntü Servisi** | Dummy (varsayılan) veya Keras (gerçek model) |

---

## Proje Yapısı

```
Recipes-using-image-processing/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app
│   │   ├── database.py              # SQLAlchemy engine + session
│   │   ├── settings.py              # Pydantic settings (.env)
│   │   ├── security.py              # JWT + bcrypt
│   │   ├── deps.py                  # Auth dependencies
│   │   ├── seed.py                  # Başlangıç verisi
│   │   ├── models/                  # SQLAlchemy ORM modelleri
│   │   ├── schemas/                 # Pydantic şemaları
│   │   ├── routes/                  # API endpoint'leri
│   │   │   ├── auth.py
│   │   │   ├── recipes.py
│   │   │   ├── ingredients.py
│   │   │   ├── recommendations.py
│   │   │   ├── users.py
│   │   │   └── admin.py
│   │   ├── services/
│   │   │   └── recommendation_service.py
│   │   └── ml/
│   │       └── image_recognition_service.py  # Dummy / Keras
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/ui/
│   │   ├── App.tsx                  # Router + navbar
│   │   ├── api.ts                   # HTTP istek yardımcısı
│   │   ├── authStore.ts             # localStorage token
│   │   ├── styles.css               # Global stiller
│   │   ├── pages/                   # Tüm sayfa bileşenleri
│   │   └── components/              # Ortak bileşenler
│   ├── package.json
│   └── vite.config.ts               # Proxy → backend 8000
├── vegetable-classification/        # Mevcut ML veri seti + model
├── datasets/                        # Ek veri setleri için
├── ml_models/                       # Eğitilmiş model dosyaları için
└── README.md
```

---

## Kurulum

### Gereksinimler
- Python 3.10+
- Node.js 18+

### 1. Backend

```powershell
# Proje kök dizininde
python -m venv .venv
.\.venv\Scripts\activate

pip install -r backend\requirements.txt

# .env dosyasını oluştur
copy backend\.env.example backend\.env
```

`.env` içeriği (gerekirse düzenle):
```env
APP_SECRET_KEY=gizli-anahtar-buraya
DATABASE_URL=sqlite:///./app.db
IMAGE_RECOGNITION_MODE=dummy
```

Backend'i başlat:
```powershell
uvicorn backend.app.main:app --reload
```

- API: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs
- Seed admin: `admin@example.com` / `admin1234`

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

UI: http://127.0.0.1:5173 (backend'e otomatik proxy)

---

## API Endpoint'leri

### Auth
| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/auth/register` | Kayıt ol |
| POST | `/auth/login` | Giriş yap |
| GET | `/auth/me` | Kullanıcı bilgisi |

### Ingredients
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/ingredients` | Tüm malzemeler |
| GET | `/ingredients/categories` | Kategoriler |
| POST | `/ingredients` | Malzeme ekle (admin) |
| PUT | `/ingredients/{id}` | Güncelle (admin) |
| DELETE | `/ingredients/{id}` | Sil (admin) |

### Recipes
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/recipes` | Tüm tarifler |
| GET | `/recipes/popular` | Popüler tarifler |
| GET | `/recipes/{id}` | Tarif detayı |
| POST | `/recipes` | Tarif ekle (auth) |
| PUT | `/recipes/{id}` | Güncelle (auth) |
| DELETE | `/recipes/{id}` | Sil (auth) |
| POST | `/recipes/{id}/favorite` | Favorile |
| DELETE | `/recipes/{id}/favorite` | Favoriden çıkar |
| POST | `/recipes/{id}/save` | Kaydet |
| DELETE | `/recipes/{id}/save` | Kaydı kaldır |

### Recommendations
| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/recommendations/by-ingredients` | Malzeme listesiyle öneri |
| POST | `/recommendations/by-image` | Fotoğrafla öneri (auth) |

### Users
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/users/me/favorites` | Favorilerim |
| GET | `/users/me/saved` | Kaydettiklerim |

### Admin
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/admin/pending-recipes` | Onay bekleyenler |
| PUT | `/admin/recipes/{id}/approve` | Onayla |
| PUT | `/admin/recipes/{id}/reject` | Reddet |

---

## Öneri Algoritması

```
score = (eşleşme_oranı × 0.70)
      + (eksik_azlığı   × 0.15)
      + (favori_norm    × 0.10)
      + (kaydet_norm    × 0.05)
```

- `eşleşme_oranı`: Kullanıcı malzemeleri / tarif malzemeleri kesişimi
- `eksik_azlığı`: 1 – (eksik / toplam tarif malzemesi)
- `favori_norm`: min(1, favoriler / 200)
- `kaydet_norm`: min(1, kaydetmeler / 200)

---

## Görüntü İşleme Servisi

Servis: `backend/app/ml/image_recognition_service.py`

**Dummy mod** (varsayılan): Dosya adından/rastgele malzeme döndürür.

**Keras mod** (gerçek model):
1. `.env` içinde: `IMAGE_RECOGNITION_MODE=keras`
2. Model yolu: `KERAS_MODEL_PATH=./vegetable-classification/vegetable_model.keras`
3. Etiket yolu: `KERAS_LABELS_PATH=./vegetable-classification/labels.txt`
4. Bağımlılıklar: `pip install tensorflow numpy pillow`

Kendi modelini entegre etmek için `_keras_detect()` fonksiyonunu güncelle.

**Desteklenen format**: `.pt`, `.h5`, `.keras`, `.pkl` — `model_loader.py` içinde özel yükleme mantığı eklenebilir.

---

## Veritabanı

Geliştirmede SQLite kullanılır. PostgreSQL'e geçiş için `.env`:

```env
DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/recipes
```

Bağımlılık ekle: `pip install psycopg[binary]`

---

## Notlar

- Uygulama ilk çalışmada otomatik seed verisi yükler (admin, kategoriler, malzemeler, örnek tarifler).
- Kullanıcıların eklediği tarifler admin onayına gider (`is_approved=False`); admin olanların tarifleri direkt yayınlanır.
- Şifre hashleme: bcrypt (rounds: `.env`'deki `PASSWORD_BCRYPT_ROUNDS`).
- Token ömrü: `APP_ACCESS_TOKEN_EXPIRE_MINUTES` (varsayılan 7 gün).
