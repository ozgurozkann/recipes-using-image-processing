from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_admin
from ..models import Recipe
from ..schemas.recipes import RecipeOut


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/pending-recipes", response_model=dict[str, list[RecipeOut]])
def pending(db: Session = Depends(get_db)) -> dict[str, list[RecipeOut]]:
    items = db.execute(select(Recipe).where(Recipe.is_approved == False)).scalars().all()  # noqa: E712
    return {
        "items": [
            RecipeOut(
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
            for r in items
        ]
    }


@router.put("/recipes/{recipe_id}/approve", response_model=dict[str, bool])
def approve(recipe_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    r = db.get(Recipe, recipe_id)
    if not r:
        raise HTTPException(status_code=404, detail="Recipe not found")
    r.is_approved = True
    db.commit()
    return {"approved": True}


@router.put("/recipes/{recipe_id}/reject", response_model=dict[str, bool])
def reject(recipe_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    r = db.get(Recipe, recipe_id)
    if not r:
        raise HTTPException(status_code=404, detail="Recipe not found")
    r.is_approved = False
    db.commit()
    return {"rejected": True}

