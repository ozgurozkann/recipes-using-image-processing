from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, get_optional_user
from ..models import FavoriteRecipe, Ingredient, Recipe, RecipeIngredient, RecipeReview, SavedRecipe, User
from ..schemas.recipes import RecipeCreateIn, RecipeIngredientOut, RecipeOut, RecipeUpdateIn, ReviewIn, ReviewOut


router = APIRouter(prefix="/recipes", tags=["recipes"])


def _recipe_out(r: Recipe, *, is_favorited: bool = False, is_saved: bool = False) -> RecipeOut:
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
        is_favorited=is_favorited,
        is_saved=is_saved,
    )


@router.get("", response_model=dict)
def list_recipes(
    db: Session = Depends(get_db),
    approved_only: bool = True,
    skip: int = 0,
    limit: int = 12,
    q: str = "",
    difficulty: str = "",
) -> dict:
    from sqlalchemy import func
    stmt = select(Recipe)
    if approved_only:
        stmt = stmt.where(Recipe.is_approved == True)  # noqa: E712
    if q:
        stmt = stmt.where(Recipe.title.ilike(f"%{q}%"))
    if difficulty:
        stmt = stmt.where(Recipe.difficulty == difficulty)
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    items = db.execute(stmt.order_by(desc(Recipe.created_at)).offset(skip).limit(limit)).scalars().all()
    return {
        "items": [_recipe_out(r) for r in items],
        "total": total,
        "has_more": skip + limit < total,
    }


@router.get("/popular", response_model=dict[str, list[RecipeOut]])
def popular(db: Session = Depends(get_db)) -> dict[str, list[RecipeOut]]:
    # avg_rating ve review_count subquery
    review_sub = (
        select(
            RecipeReview.recipe_id,
            func.avg(RecipeReview.rating).label("avg_rating"),
            func.count(RecipeReview.id).label("review_count"),
        )
        .group_by(RecipeReview.recipe_id)
        .subquery()
    )
    rows = db.execute(
        select(Recipe, review_sub.c.avg_rating, review_sub.c.review_count)
        .outerjoin(review_sub, Recipe.id == review_sub.c.recipe_id)
        .where(Recipe.is_approved == True)  # noqa: E712
        .limit(200)
    ).all()

    def _score(r: Recipe, avg_r: float | None, rev_cnt: int | None) -> float:
        fav  = min(1.0, (r.favorite_count or 0) / 200.0)
        sav  = min(1.0, (r.save_count or 0) / 200.0)
        rat  = ((avg_r or 0) / 5.0)
        rcnt = min(1.0, (rev_cnt or 0) / 50.0)
        return fav * 0.40 + sav * 0.25 + rat * 0.25 + rcnt * 0.10

    ranked = sorted(rows, key=lambda t: _score(t[0], t[1], t[2]), reverse=True)[:30]
    return {"items": [_recipe_out(r) for r, _, __ in ranked]}


@router.get("/{recipe_id}", response_model=RecipeOut)
def get_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> RecipeOut:
    r = db.get(Recipe, recipe_id)
    if not r or not r.is_approved:
        raise HTTPException(status_code=404, detail="Recipe not found")
    is_favorited = False
    is_saved = False
    if user:
        is_favorited = db.execute(
            select(FavoriteRecipe.id).where(FavoriteRecipe.user_id == user.id, FavoriteRecipe.recipe_id == recipe_id)
        ).scalar_one_or_none() is not None
        is_saved = db.execute(
            select(SavedRecipe.id).where(SavedRecipe.user_id == user.id, SavedRecipe.recipe_id == recipe_id)
        ).scalar_one_or_none() is not None
    rows = db.execute(
        select(RecipeIngredient, Ingredient)
        .join(Ingredient, RecipeIngredient.ingredient_id == Ingredient.id)
        .where(RecipeIngredient.recipe_id == recipe_id)
    ).all()
    out = _recipe_out(r, is_favorited=is_favorited, is_saved=is_saved)
    out.ingredients = [
        RecipeIngredientOut(
            ingredient_id=ri.ingredient_id,
            name=ing.name,
            quantity=ri.quantity,
            unit=ri.unit,
        )
        for ri, ing in rows
    ]
    return out


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


@router.get("/{recipe_id}/reviews", response_model=dict[str, list[ReviewOut]])
def list_reviews(
    recipe_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> dict[str, list[ReviewOut]]:
    rows = db.execute(
        select(RecipeReview, User)
        .join(User, User.id == RecipeReview.user_id)
        .where(RecipeReview.recipe_id == recipe_id)
        .order_by(desc(RecipeReview.created_at))
    ).all()
    reviews = [
        ReviewOut(
            id=rv.id,
            user_id=rv.user_id,
            user_name=u.full_name or u.email.split("@")[0],
            user_avatar=u.avatar_url,
            rating=rv.rating,
            comment=rv.comment,
            created_at=rv.created_at,
            is_mine=(user is not None and rv.user_id == user.id),
        )
        for rv, u in rows
    ]
    return {"items": reviews}


@router.post("/{recipe_id}/reviews", response_model=ReviewOut)
def add_review(
    recipe_id: int,
    payload: ReviewIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReviewOut:
    r = db.get(Recipe, recipe_id)
    if not r or not r.is_approved:
        raise HTTPException(status_code=404, detail="Recipe not found")
    rv = RecipeReview(recipe_id=recipe_id, user_id=user.id, rating=payload.rating, comment=payload.comment)
    db.add(rv)
    db.commit()
    db.refresh(rv)
    return ReviewOut(
        id=rv.id,
        user_id=rv.user_id,
        user_name=user.full_name or user.email.split("@")[0],
        user_avatar=user.avatar_url,
        rating=rv.rating,
        comment=rv.comment,
        created_at=rv.created_at,
        is_mine=True,
    )


@router.delete("/{recipe_id}/reviews/{review_id}", response_model=dict[str, bool])
def delete_review(
    recipe_id: int,
    review_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, bool]:
    review = db.execute(
        select(RecipeReview).where(
            RecipeReview.id == review_id,
            RecipeReview.recipe_id == recipe_id,
        )
    ).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Sadece yorumu yazan veya admin silebilir/düzenleyebilir.
    if review.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Başkasının yorumunu silemezsiniz")

    db.delete(review)
    db.commit()
    return {"deleted": True}
