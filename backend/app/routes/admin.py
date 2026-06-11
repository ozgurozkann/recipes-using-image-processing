from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_admin
from ..models import Ingredient, Recipe, RecipeIngredient, User
from ..schemas.recipes import RecipeIngredientOut, RecipeOut


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


class AdminUserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    created_at: datetime


class AdminUserUpdateIn(BaseModel):
    role: str


def _recipe_out(r: Recipe) -> RecipeOut:
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


@router.get("/recipes", response_model=dict)
def recipes(skip: int = 0, limit: int = 100, q: str = "", db: Session = Depends(get_db)) -> dict:
    stmt = select(Recipe)
    if q:
        stmt = stmt.where(Recipe.title.ilike(f"%{q}%"))
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    items = db.execute(stmt.order_by(desc(Recipe.created_at)).offset(skip).limit(limit)).scalars().all()
    return {
        "items": [_recipe_out(r) for r in items],
        "total": total,
        "has_more": skip + limit < total,
    }


@router.get("/recipes/{recipe_id}", response_model=RecipeOut)
def get_recipe_detail(recipe_id: int, db: Session = Depends(get_db)) -> RecipeOut:
    r = db.get(Recipe, recipe_id)
    if not r:
        raise HTTPException(status_code=404, detail="Recipe not found")
    rows = db.execute(
        select(RecipeIngredient, Ingredient)
        .join(Ingredient, RecipeIngredient.ingredient_id == Ingredient.id)
        .where(RecipeIngredient.recipe_id == recipe_id)
    ).all()
    out = _recipe_out(r)
    out.ingredients = [
        RecipeIngredientOut(ingredient_id=ri.ingredient_id, name=ing.name, quantity=ri.quantity, unit=ri.unit)
        for ri, ing in rows
    ]
    return out


@router.get("/pending-recipes", response_model=dict[str, list[RecipeOut]])
def pending(db: Session = Depends(get_db)) -> dict[str, list[RecipeOut]]:
    items = db.execute(select(Recipe).where(Recipe.is_approved == False)).scalars().all()  # noqa: E712
    return {"items": [_recipe_out(r) for r in items]}


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


@router.get("/users", response_model=dict[str, list[AdminUserOut]])
def users(db: Session = Depends(get_db)) -> dict[str, list[AdminUserOut]]:
    items = db.execute(select(User).order_by(desc(User.created_at))).scalars().all()
    return {"items": [AdminUserOut.model_validate(u, from_attributes=True) for u in items]}


@router.put("/users/{user_id}", response_model=AdminUserOut)
def update_user(user_id: int, payload: AdminUserUpdateIn, db: Session = Depends(get_db)) -> AdminUserOut:
    if payload.role not in {"user", "admin"}:
        raise HTTPException(status_code=422, detail="Role must be user or admin")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return AdminUserOut.model_validate(user, from_attributes=True)


@router.delete("/users/{user_id}", response_model=dict[str, bool])
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, bool]:
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        admin_count = db.execute(select(func.count()).select_from(User).where(User.role == "admin")).scalar_one()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="At least one admin must remain")
    db.delete(user)
    db.commit()
    return {"deleted": True}

