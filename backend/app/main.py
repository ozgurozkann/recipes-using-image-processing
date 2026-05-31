from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine
from .models import Base  # noqa: F401
from .routes import admin, auth, ingredients, recommendations, recipes, users
from .seed import seed_if_empty

UPLOADS_DIR = Path("uploads")


def create_app() -> FastAPI:
    app = FastAPI(title="Recipes API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def _startup() -> None:
        Base.metadata.create_all(bind=engine)
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
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
