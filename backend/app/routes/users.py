from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import FavoriteRecipe, Recipe, SavedRecipe, User
from ..schemas.recipes import RecipeOut


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


@router.get("/me/saved", response_model=dict[str, list[RecipeOut]])
def my_saved(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, list[RecipeOut]]:
    recipes = db.execute(
        select(Recipe)
        .join(SavedRecipe, SavedRecipe.recipe_id == Recipe.id)
        .where(SavedRecipe.user_id == user.id, Recipe.is_approved == True)  # noqa: E712
        .order_by(Recipe.title.asc())
    ).scalars().all()
    return {"items": [_out(r) for r in recipes]}

