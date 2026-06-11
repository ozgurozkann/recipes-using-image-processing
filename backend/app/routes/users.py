from __future__ import annotations

import time
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import FavoriteRecipe, Recipe, RecipeReview, SavedRecipe, User
from ..schemas.auth import UserOut
from ..schemas.recipes import RecipeOut

AVATARS_DIR = Path("uploads/avatars")


router = APIRouter(prefix="/users", tags=["users"])


def _out(r: Recipe) -> RecipeOut:
    return RecipeOut(
        id=r.id,
        title=r.title,
        description=r.description,
        instructions=r.instructions,
        cooking_time=r.cooking_time,
        serving_count=r.serving_count,
        difficulty=r.difficulty,
        category_id=r.category_id,
        image_url=r.image_url,
        created_by_user_id=r.created_by_user_id,
        is_approved=r.is_approved,
        favorite_count=r.favorite_count,
        save_count=r.save_count,
    )


@router.get("/me/favorites", response_model=dict[str, list[RecipeOut]])
def my_favorites(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, list[RecipeOut]]:
    recipes = db.execute(
        select(Recipe)
        .join(FavoriteRecipe, FavoriteRecipe.recipe_id == Recipe.id)
        .where(FavoriteRecipe.user_id == user.id, Recipe.is_approved == True)  # noqa: E712
        .order_by(Recipe.title.asc())
    ).scalars().all()
    return {"items": [_out(r) for r in recipes]}


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserOut:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Yalnızca görsel dosyası yüklenebilir")
    data = await file.read()
    AVATARS_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "avatar.jpg").suffix or ".jpg"
    filename = f"avatar_{user.id}_{int(time.time() * 1000)}{ext}"
    path = AVATARS_DIR / filename
    path.write_bytes(data)
    user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(user)
    return UserOut(id=user.id, full_name=user.full_name, email=user.email, role=user.role, avatar_url=user.avatar_url)


@router.get("/me/saved", response_model=dict[str, list[RecipeOut]])
def my_saved(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, list[RecipeOut]]:
    recipes = db.execute(
        select(Recipe)
        .join(SavedRecipe, SavedRecipe.recipe_id == Recipe.id)
        .where(SavedRecipe.user_id == user.id, Recipe.is_approved == True)  # noqa: E712
        .order_by(Recipe.title.asc())
    ).scalars().all()
    return {"items": [_out(r) for r in recipes]}


@router.get("/me/profile-summary", response_model=dict)
def profile_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    week_start = datetime.utcnow() - timedelta(days=7)

    favorites = db.execute(
        select(func.count()).select_from(FavoriteRecipe).where(FavoriteRecipe.user_id == user.id)
    ).scalar_one()
    saved = db.execute(
        select(func.count()).select_from(SavedRecipe).where(SavedRecipe.user_id == user.id)
    ).scalar_one()
    recipes_added = db.execute(
        select(func.count()).select_from(Recipe).where(Recipe.created_by_user_id == user.id)
    ).scalar_one()
    reviews = db.execute(
        select(func.count()).select_from(RecipeReview).where(RecipeReview.user_id == user.id)
    ).scalar_one()

    weekly_favorites = db.execute(
        select(func.count()).select_from(FavoriteRecipe).where(
            FavoriteRecipe.user_id == user.id,
            FavoriteRecipe.created_at >= week_start,
        )
    ).scalar_one()
    weekly_saved = db.execute(
        select(func.count()).select_from(SavedRecipe).where(
            SavedRecipe.user_id == user.id,
            SavedRecipe.created_at >= week_start,
        )
    ).scalar_one()
    weekly_recipes_added = db.execute(
        select(func.count()).select_from(Recipe).where(
            Recipe.created_by_user_id == user.id,
            Recipe.created_at >= week_start,
        )
    ).scalar_one()
    weekly_reviews = db.execute(
        select(func.count()).select_from(RecipeReview).where(
            RecipeReview.user_id == user.id,
            RecipeReview.created_at >= week_start,
        )
    ).scalar_one()

    weekly_score = min(
        100,
        int(
            weekly_recipes_added * 30
            + weekly_reviews * 15
            + weekly_favorites * 10
            + weekly_saved * 8
        ),
    )

    return {
        "favorites": favorites,
        "saved": saved,
        "recipes_added": recipes_added,
        "reviews": reviews,
        "weekly": {
            "favorites": weekly_favorites,
            "saved": weekly_saved,
            "recipes_added": weekly_recipes_added,
            "reviews": weekly_reviews,
            "score": weekly_score,
        },
    }

