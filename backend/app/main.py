from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .database import engine
from .models import Base  # noqa: F401
from .routes import admin, auth, ingredients, recommendations, recipes, users
from .seed import seed_if_empty

UPLOADS_DIR = Path("uploads")


def _migrate_avatar_url() -> None:
    """Mevcut veritabanına avatar_url kolonu yoksa ekler."""
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)"))
            conn.commit()
        except Exception:
            pass  # kolon zaten var


def _migrate_reviews_drop_unique() -> None:
    """recipe_reviews tablosundaki (recipe_id, user_id) unique constraint'i kaldırır."""
    url = str(engine.url)
    with engine.connect() as conn:
        if url.startswith("sqlite"):
            # SQLite: constraint'i kaldırmanın tek yolu tabloyu yeniden oluşturmak
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS recipe_reviews_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        recipe_id INTEGER NOT NULL,
                        user_id INTEGER NOT NULL,
                        rating INTEGER NOT NULL,
                        comment VARCHAR(1000) DEFAULT '',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                conn.execute(text(
                    "INSERT OR IGNORE INTO recipe_reviews_new "
                    "SELECT id, recipe_id, user_id, rating, comment, created_at FROM recipe_reviews"
                ))
                conn.execute(text("DROP TABLE recipe_reviews"))
                conn.execute(text("ALTER TABLE recipe_reviews_new RENAME TO recipe_reviews"))
                conn.commit()
            except Exception:
                conn.rollback()
        elif url.startswith("mysql"):
            try:
                conn.execute(text("ALTER TABLE recipe_reviews DROP INDEX uq_review_recipe_user"))
                conn.commit()
            except Exception:
                pass
        else:  # PostgreSQL
            try:
                conn.execute(text("ALTER TABLE recipe_reviews DROP CONSTRAINT IF EXISTS uq_review_recipe_user"))
                conn.commit()
            except Exception:
                pass


def create_app() -> FastAPI:
    app = FastAPI(title="Recipes API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                       "http://localhost:5174", "http://127.0.0.1:5174"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def _startup() -> None:
        Base.metadata.create_all(bind=engine)
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        _migrate_avatar_url()
        _migrate_reviews_drop_unique()
        from .database import SessionLocal

        with SessionLocal() as db:
            seed_if_empty(db)

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

    app.include_router(auth.router)
    app.include_router(ingredients.router)
    app.include_router(recipes.router)
    app.include_router(recommendations.router)
    app.include_router(admin.router)
    app.include_router(users.router)

    return app


app = create_app()
