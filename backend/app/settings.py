from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")

    app_env: str = "dev"
    app_secret_key: str = "change-me"
    app_access_token_expire_minutes: int = 60 * 24 * 7

    database_url: str = "sqlite:///./app.db"
    password_bcrypt_rounds: int = 12

    image_recognition_mode: str = "dummy"  # dummy|keras
    keras_model_path: str = "./vegetable-classification/vegetable_model.keras"
    keras_labels_path: str = "./vegetable-classification/labels.txt"


settings = Settings()
