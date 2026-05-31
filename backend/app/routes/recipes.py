from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import FavoriteRecipe, Recipe, RecipeIngredient, SavedRecipe, User
from ..schemas.recipes import RecipeCreateIn, RecipeOut, RecipeUpdateIn


router = APIRouter(prefix="/recipes", tags=["recipes"])


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


@router.get("", response_model=dict[str, list[RecipeOut]])
def list_recipes(db: Session = Depends(get_db), approved_only: bool = True) -> dict[str, list[RecipeOut]]:
    stmt = select(Recipe)
    if approved_only:
        stmt = stmt.where(Recipe.is_approved == True)  # noqa: E712
    items = db.execute(stmt.order_by(desc(Recipe.created_at))).scalars().all()
    return {"items": [_recipe_out(r) for r in items]}


@router.get("/popular", response_model=dict[str, list[RecipeOut]])
def popular(db: Session = Depends(get_db)) -> dict[str, list[RecipeOut]]:
    items = db.execute(
        select(Recipe)
        .where(Recipe.is_approved == True)  # noqa: E712
        .order_by(desc(Recipe.favorite_count), desc(Recipe.save_count), desc(Recipe.created_at))
        .limit(30)
    ).scalars().all()
    return {"items": [_recipe_out(r) for r in items]}


@router.get("/{recipe_id}", response_model=RecipeOut)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)) -> RecipeOut:
    r = db.get(Recipe, recipe_id)
    if not r or not r.is_approved:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _recipe_out(r)


@router.post("", response_model=RecipeOut)
def create_recipe(payload: RecipeCreateIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> RecipeOut:
    r = Recipe(
        title=payload.title.strip(),
        description=payload.description,
        instructions=payload.instructions,
        cooking_time=payload.cooking_time,
        serving_count=payload.serving_count,
        difficulty=payload.difficulty,
        category_id=payload.category_id,
        image_url=payload.image_url,
        created_by_user_id=user.id,
        is_approved=(user.role == "admin"),
        favorite_count=0,
        save_count=0,
    )
    db.add(r)
    db.flush()
    for ing in payload.ingredients:
        db.add(RecipeIngredient(recipe_id=r.id, ingredient_id=ing.ingredient_id, quantity=ing.quantity, unit=ing.unit))
    db.commit()
    db.refresh(r)
    return _recipe_out(r)


@router.put("/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: int, payload: RecipeUpdateIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> RecipeOut:
    r = db.get(Recipe, recipe_id)
    if not r:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if user.role != "admin" and r.created_by_user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    for k, v in payload.model_dump(exclude_unset=True).items():
        if k == "ingredients":
            continue
        setattr(r, k, v)

    if payload.ingredients is not None:
        db.query(RecipeIngredient).where(RecipeIngredient.recipe_id == r.id).delete()
        for ing in payload.ingredients:
            db.add(RecipeIngredient(recipe_id=r.id, ingredient_id=ing.ingredient_id, quantity=ing.quantity, unit=ing.unit))

    db.commit()
    db.refresh(r)
    return _recipe_out(r)


@router.delete("/{recipe_id}", response_model=dict[str, bool])
def delete_recipe(recipe_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, bool]:
    r = db.get(Recipe, recipe_id)
    if not r:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if user.role != "admin" and r.created_by_user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(r)
    db.commit()
    return {"deleted": True}


@router.post("/{recipe_id}/favorite", response_model=dict[str, bool])
def favorite(recipe_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, bool]:
    r = db.get(Recipe, recipe_id)
    if not r or not r.is_approved:
        raise HTTPException(status_code=404, detail="Recipe not found")
    existing = db.execute(
        select(FavoriteRecipe).where(FavoriteRecipe.user_id == user.id, FavoriteRecipe.recipe_id == recipe_id)
    ).scalar_one_or_none()
    if existing:
        return {"favorited": True}
    db.add(FavoriteRecipe(user_id=user.id, recipe_id=recipe_id))
    r.favorite_count += 1
    db.commit()
    return {"favorited": True}


@router.delete("/{recipe_id}/favorite", response_model=dict[str, bool])
def unfavorite(recipe_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, bool]:
    existing = db.execute(
        select(FavoriteRecipe).where(FavoriteRecipe.user_id == user.id, FavoriteRecipe.recipe_id == recipe_id)
    ).scalar_one_or_none()
    if not existing:
        return {"favorited": False}
    r = db.get(Recipe, recipe_id)
    if r and r.favorite_count > 0:
        r.favorite_count -= 1
    db.delete(existing)
    db.commit()
    return {"favorited": False}


@router.post("/{recipe_id}/save", response_model=dict[str, bool])
def save(recipe_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, bool]:
    r = db.get(Recipe, recipe_id)
    if not r or not r.is_approved:
        raise HTTPException(status_code=404, detail="Recipe not found")
    existing = db.execute(
        select(SavedRecipe).where(SavedRecipe.user_id == user.id, SavedRecipe.recipe_id == recipe_id)
    ).scalar_one_or_none()
    if existing:
        return {"saved": True}
    db.add(SavedRecipe(user_id=user.id, recipe_id=recipe_id))
    r.save_count += 1
    db.commit()
    return {"saved": True}


@router.delete("/{recipe_id}/save", response_model=dict[str, bool])
def unsave(recipe_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, bool]:
    existing = db.execute(
        select(SavedRecipe).where(SavedRecipe.user_id == user.id, SavedRecipe.recipe_id == recipe_id)
    ).scalar_one_or_none()
    if not existing:
        return {"saved": False}
    r = db.get(Recipe, recipe_id)
    if r and r.save_count > 0:
        r.save_count -= 1
    db.delete(existing)
    db.commit()
    return {"saved": False}

