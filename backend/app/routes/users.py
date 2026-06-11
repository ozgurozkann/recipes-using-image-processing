from __future__ import annotations

import time
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import FavoriteRecipe, Recipe, SavedRecipe, User
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
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Dosya boyutu 5 MB'ı aşamaz")
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

