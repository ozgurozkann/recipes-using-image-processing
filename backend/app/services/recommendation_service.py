from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Ingredient, Recipe, RecipeIngredient


@dataclass(frozen=True)
class RecommendResult:
    recipe_id: int
    title: str
    match_score: int
    matched_ingredients: list[str]
    missing_ingredients: list[str]
    favorite_count: int
    save_count: int


def recommend_by_ingredient_ids(db: Session, ingredient_ids: list[int], limit: int = 20) -> list[RecommendResult]:
    ingredient_ids = [int(x) for x in ingredient_ids if x]
    if not ingredient_ids:
        return []

    input_set = set(ingredient_ids)
    ingredient_names = {
        row.id: row.name
        for row in db.execute(select(Ingredient).where(Ingredient.id.in_(ingredient_ids))).scalars().all()
    }

    recipes = db.execute(select(Recipe).where(Recipe.is_approved == True)).scalars().all()  # noqa: E712
    results: list[RecommendResult] = []

    for recipe in recipes:
        rows = db.execute(
            select(RecipeIngredient, Ingredient)
            .join(Ingredient, Ingredient.id == RecipeIngredient.ingredient_id)
            .where(RecipeIngredient.recipe_id == recipe.id)
        ).all()

        recipe_ing_ids = [ri.ingredient_id for (ri, _) in rows]
        recipe_ing_names = {ri.ingredient_id: ing.name for (ri, ing) in rows}

        if not recipe_ing_ids:
            continue

        matched = [recipe_ing_names[i] for i in recipe_ing_ids if i in input_set]
        missing = [recipe_ing_names[i] for i in recipe_ing_ids if i not in input_set]

        match_ratio = len(matched) / max(1, len(recipe_ing_ids))
        missing_ratio = 1.0 - (len(missing) / max(1, len(recipe_ing_ids)))

        # Weights from spec:
        # match ratio: 70%, missing smallness: 15%, favorite: 10%, save: 5%
        fav_norm = min(1.0, recipe.favorite_count / 200.0)
        save_norm = min(1.0, recipe.save_count / 200.0)
        score = (
            (match_ratio * 0.70)
            + (missing_ratio * 0.15)
            + (fav_norm * 0.10)
            + (save_norm * 0.05)
        )
        match_score = int(round(score * 100))
        if match_score <= 0:
            continue

        results.append(
            RecommendResult(
                recipe_id=recipe.id,
                title=recipe.title,
                match_score=match_score,
                matched_ingredients=matched,
                missing_ingredients=missing,
                favorite_count=recipe.favorite_count,
                save_count=recipe.save_count,
            )
        )

    results.sort(key=lambda r: (-r.match_score, -r.favorite_count, -r.save_count, r.title))
    return results[:limit]

