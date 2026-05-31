from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def _find_env_file() -> str:
    """
    .env dosyasını şu sırayla arar:
      1. backend/.env  (settings.py'nin üst dizini)
      2. .env          (çalışma dizini — uvicorn proje kökünden çalıştırılırsa)
    Bulunan ilk dosyayı döndürür; yoksa varsayılan "backend/.env" kullanılır.
    """
    candidates = [
        Path(__file__).resolve().parent.parent / ".env",  # backend/.env
        Path(".env"),                                       # cwd/.env
        Path("backend") / ".env",                          # cwd/backend/.env
    ]
    for p in candidates:
        if p.exists():
            return str(p)
    # Hiçbiri yoksa backend/.env'i göster (pydantic-settings hata vermez, sadece varsayılanları kullanır)
    return str(Path(__file__).resolve().parent.parent / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_find_env_file(),
        env_file_encoding="utf-8",
        env_prefix="",
        extra="ignore",
    )

    app_env: str = "dev"
    app_secret_key: str = "change-me"
    app_access_token_expire_minutes: int = 60 * 24 * 7

    database_url: str = "sqlite:///./app.db"
    password_bcrypt_rounds: int = 12

    image_recognition_mode: str = "dummy"  # dummy | keras
    keras_model_path: str = "./vegetable-classification/vegetable_model.keras"
    keras_labels_path: str = "./vegetable-classification/labels.txt"


settings = Settings()
