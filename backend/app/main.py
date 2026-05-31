from __future__ import annotations

from fastapi import FastAPI

from .database import engine
from .models import Base  # noqa: F401
from .routes import admin, auth, ingredients, recommendations, recipes, users
from .seed import seed_if_empty


def create_app() -> FastAPI:
    app = FastAPI(title="Recipes API", version="0.1.0")

    @app.on_event("startup")
    def _startup() -> None:
        Base.metadata.create_all(bind=engine)
        from .database import SessionLocal

        with SessionLocal() as db:
            seed_if_empty(db)

    app.include_router(auth.router)
    app.include_router(ingredients.router)
    app.include_router(recipes.router)
    app.include_router(recommendations.router)
    app.include_router(admin.router)
    app.include_router(users.router)

    return app


app = create_app()
