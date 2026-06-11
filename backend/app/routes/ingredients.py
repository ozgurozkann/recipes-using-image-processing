from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_admin
from ..models import Ingredient, IngredientCategory, User
from ..schemas.ingredients import (
    IngredientCategoryOut,
    IngredientCreateIn,
    IngredientOut,
    IngredientUpdateIn,
)


router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.get("", response_model=dict[str, list[IngredientOut]])
def list_ingredients(db: Session = Depends(get_db)) -> dict[str, list[IngredientOut]]:
    items = db.execute(select(Ingredient).order_by(Ingredient.name.asc())).scalars().all()
    return {"items": [IngredientOut.model_validate(i) for i in items]}


@router.get("/categories", response_model=dict[str, list[IngredientCategoryOut]])
def list_categories(db: Session = Depends(get_db)) -> dict[str, list[IngredientCategoryOut]]:
    items = db.execute(select(IngredientCategory).order_by(IngredientCategory.name.asc())).scalars().all()
    return {"items": [IngredientCategoryOut.model_validate(c) for c in items]}


@router.post("/categories", response_model=IngredientCategoryOut, dependencies=[Depends(require_admin)])
def create_category(payload: dict[str, str], db: Session = Depends(get_db)) -> IngredientCategoryOut:
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Missing name")
    existing = db.execute(select(IngredientCategory).where(IngredientCategory.name == name)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Category already exists")
    c = IngredientCategory(name=name)
    db.add(c)
    db.commit()
    db.refresh(c)
    return IngredientCategoryOut.model_validate(c)


@router.put("/categories/{category_id}", response_model=IngredientCategoryOut, dependencies=[Depends(require_admin)])
def update_category(category_id: int, payload: dict[str, str], db: Session = Depends(get_db)) -> IngredientCategoryOut:
    c = db.get(IngredientCategory, category_id)
    if not c:
        raise HTTPException(status_code=404, detail="Category not found")
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Missing name")
    c.name = name
    db.commit()
    db.refresh(c)
    return IngredientCategoryOut.model_validate(c)


@router.delete("/categories/{category_id}", response_model=dict[str, bool], dependencies=[Depends(require_admin)])
def delete_category(category_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    c = db.get(IngredientCategory, category_id)
    if not c:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(c)
    db.commit()
    return {"deleted": True}


@router.post("/suggest", response_model=IngredientOut)
def suggest_ingredient(
    payload: IngredientCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> IngredientOut:
    """Giriş yapmış her kullanıcı yeni malzeme önerebilir. Aynı isim varsa mevcut kaydı döner."""
    name = payload.name.strip().lower()
    existing = db.execute(select(Ingredient).where(Ingredient.name == name)).scalar_one_or_none()
    if existing:
        return IngredientOut.model_validate(existing)
    item = Ingredient(name=name, category_id=payload.category_id, unit_type=payload.unit_type or "adet")
    db.add(item)
    db.commit()
    db.refresh(item)
    return IngredientOut.model_validate(item)


@router.post("", response_model=IngredientOut, dependencies=[Depends(require_admin)])
def create_ingredient(payload: IngredientCreateIn, db: Session = Depends(get_db)) -> IngredientOut:
    name = payload.name.strip().lower()
    existing = db.execute(select(Ingredient).where(Ingredient.name == name)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Ingredient already exists")
    item = Ingredient(name=name, category_id=payload.category_id, unit_type=payload.unit_type)
    db.add(item)
    db.commit()
    db.refresh(item)
    return IngredientOut.model_validate(item)


@router.put("/{ingredient_id}", response_model=IngredientOut, dependencies=[Depends(require_admin)])
def update_ingredient(ingredient_id: int, payload: IngredientUpdateIn, db: Session = Depends(get_db)) -> IngredientOut:
    item = db.get(Ingredient, ingredient_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    if payload.name is not None:
        item.name = payload.name.strip().lower()
    if payload.category_id is not None:
        item.category_id = payload.category_id
    if payload.unit_type is not None:
        item.unit_type = payload.unit_type
    db.commit()
    db.refresh(item)
    return IngredientOut.model_validate(item)


@router.delete("/{ingredient_id}", response_model=dict[str, bool], dependencies=[Depends(require_admin)])
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    item = db.get(Ingredient, ingredient_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    db.delete(item)
    db.commit()
    return {"deleted": True}
