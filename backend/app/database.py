from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session, sessionmaker

from .settings import settings


def _make_engine():
    url = settings.database_url

    if url.startswith("sqlite"):
        # SQLite: thread safety kapatılır
        return create_engine(
            url,
            pool_pre_ping=True,
            connect_args={"check_same_thread": False},
        )

    if url.startswith("mysql"):
        # MySQL: bağlantı havuzu + UTF-8 + yeniden bağlanma ayarları
        engine = create_engine(
            url,
            pool_pre_ping=True,          # Her kullanımdan önce bağlantıyı test et
            pool_recycle=1800,           # 30 dk'da bir bağlantıyı yenile (MySQL 8h timeout'tan önce)
            pool_size=5,                 # Havuzda tutulacak sabit bağlantı sayısı
            max_overflow=10,             # Havuz dolunca açılabilecek ekstra bağlantı
            echo=settings.app_env == "dev",  # Dev modda SQL sorgularını logla
        )

        @event.listens_for(engine, "connect")
        def _set_mysql_charset(dbapi_conn, _conn_rec):
            # Bağlantı açılınca UTF-8 karakter setini zorla
            cursor = dbapi_conn.cursor()
            cursor.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci")
            cursor.execute("SET CHARACTER SET utf8mb4")
            cursor.close()

        return engine

    # PostgreSQL ve diğerleri
    return create_engine(url, pool_pre_ping=True, pool_recycle=1800)


engine = _make_engine()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
