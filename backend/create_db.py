"""
MySQL veritabanı ve tabloları otomatik oluşturur.
İlk kurulumda veya DB sıfırlandığında çalıştırın:

    python backend/create_db.py
"""
from __future__ import annotations

import sys
import re


def _parse_mysql_dsn(url: str) -> tuple[str, str, str, int, str]:
    """
    mysql+pymysql://user:pass@host:port/dbname?...
    -> (user, password, host, port, dbname)
    """
    m = re.match(
        r"mysql\+pymysql://([^:@]+):([^@]*)@([^:/]+):?(\d+)?/([^?]+)",
        url.strip(),
    )
    if not m:
        raise ValueError(f"Gecirsiz MySQL URL: {url!r}")
    user     = m.group(1)
    password = m.group(2)
    host     = m.group(3)
    port     = int(m.group(4) or 3306)
    dbname   = m.group(5)
    return user, password, host, port, dbname


def main() -> None:
    # .env'i yükle
    try:
        from dotenv import load_dotenv
        load_dotenv("backend/.env")
    except ImportError:
        pass

    import os
    db_url = os.getenv("DATABASE_URL", "")

    if not db_url.startswith("mysql"):
        print(f"[create_db] DATABASE_URL MySQL degil: {db_url!r}")
        print("  SQLite/PostgreSQL icin veritabani SQLAlchemy tarafindan otomatik olusturulur.")
        sys.exit(0)

    try:
        user, password, host, port, dbname = _parse_mysql_dsn(db_url)
    except ValueError as e:
        print(f"[create_db] URL parse HATASI: {e}")
        sys.exit(1)

    print(f"[create_db] Sunucuya baglaniliyor: {host}:{port} (kullanici: {user})")

    # --- Adım 1: Veritabanını oluştur (pymysql ile, db_name olmadan bağlan) ---
    import pymysql

    try:
        conn = pymysql.connect(
            host=host, port=port, user=user, password=password, charset="utf8mb4"
        )
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{dbname}` "
                f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        conn.commit()
        conn.close()
        print(f"[create_db] Veritabani hazir: `{dbname}`")
    except pymysql.Error as e:
        print(f"[create_db] MySQL HATA: {e}")
        sys.exit(1)

    # --- Adım 2: Tabloları oluştur (SQLAlchemy) ---
    from app.database import engine
    from app.models import Base  # noqa: F401

    print("[create_db] Tablolar olusturuluyor...")
    Base.metadata.create_all(bind=engine)
    print("[create_db] Tablolar olusturuldu.")

    # --- Adım 3: Seed verisi ---
    from app.database import SessionLocal
    from app.seed import seed_if_empty

    print("[create_db] Seed verisi yukleniyor...")
    with SessionLocal() as db:
        seed_if_empty(db)
    print("[create_db] Tum islemler tamamlandi.")


if __name__ == "__main__":
    main()
