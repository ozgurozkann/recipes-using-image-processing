from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass

from sqlalchemy import func, select
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


def recommend_by_ingredient_ids(
    db: Session,
    ingredient_ids: list[int],
    limit: int = 20,
    require_all_inputs: bool = False,
) -> list[RecommendResult]:
    ingredient_ids = [int(x) for x in ingredient_ids if x]
    if not ingredient_ids:
        return []

    input_set = set(ingredient_ids)

    # Step 1: find candidate recipe IDs via SQL — avoids loading all 21k recipes
    match_subq = (
        select(
            RecipeIngredient.recipe_id,
            func.count(RecipeIngredient.ingredient_id).label("match_count"),
        )
        .where(RecipeIngredient.ingredient_id.in_(ingredient_ids))
        .group_by(RecipeIngredient.recipe_id)
        .subquery()
    )

    candidate_q = select(match_subq.c.recipe_id)
    if require_all_inputs:
        candidate_q = candidate_q.where(match_subq.c.match_count >= len(input_set))

    candidate_ids: list[int] = [r[0] for r in db.execute(candidate_q).all()]
    if not candidate_ids:
        return []

    # Step 2: fetch only candidate recipes (single query)
    recipes: dict[int, Recipe] = {
        r.id: r
        for r in db.execute(
            select(Recipe).where(
                Recipe.id.in_(candidate_ids),
                Recipe.is_approved == True,  # noqa: E712
            )
        )
        .scalars()
        .all()
    }
    if not recipes:
        return []

    # Step 3: fetch all ingredient associations for candidates (single JOIN query)
    rows = db.execute(
        select(
            RecipeIngredient.recipe_id,
            RecipeIngredient.ingredient_id,
            Ingredient.name,
        )
        .join(Ingredient, Ingredient.id == RecipeIngredient.ingredient_id)
        .where(RecipeIngredient.recipe_id.in_(list(recipes.keys())))
    ).all()

    recipe_ingredients: dict[int, dict[int, str]] = defaultdict(dict)
    for recipe_id, ing_id, ing_name in rows:
        recipe_ingredients[recipe_id][ing_id] = ing_name

    results: list[RecommendResult] = []

    for recipe_id, recipe_ing_names in recipe_ingredients.items():
        recipe = recipes.get(recipe_id)
        if not recipe:
            continue

        recipe_ing_ids = list(recipe_ing_names.keys())
        if require_all_inputs and not input_set.issubset(set(recipe_ing_ids)):
            continue

        matched = [recipe_ing_names[i] for i in recipe_ing_ids if i in input_set]
        missing = [recipe_ing_names[i] for i in recipe_ing_ids if i not in input_set]

        match_ratio = len(matched) / max(1, len(recipe_ing_ids))
        missing_ratio = 1.0 - (len(missing) / max(1, len(recipe_ing_ids)))

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
