#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select

from app.database import SessionLocal, engine
from app.models import Ingredient, RecipeIngredient
from app.utils.ingredient_names import clean_ingredient_name

engine.echo = False


def _db_name_key(name: str) -> str:
    replacements = str.maketrans({
        "ı": "i",
        "İ": "i",
        "ğ": "g",
        "Ğ": "g",
        "ü": "u",
        "Ü": "u",
        "ş": "s",
        "Ş": "s",
        "ö": "o",
        "Ö": "o",
        "ç": "c",
        "Ç": "c",
    })
    normalized = unicodedata.normalize("NFKD", name.translate(replacements))
    return "".join(ch for ch in normalized if not unicodedata.combining(ch)).lower()


def _display_name_score(name: str) -> tuple[int, int, int]:
    has_turkish = any(ch in name for ch in "çğıöşü")
    return (0 if has_turkish else 1, len(name), name.count(" "))


def clean_database(*, dry_run: bool) -> dict[str, int]:
    stats = {
        "ingredients_total": 0,
        "ingredients_renamed": 0,
        "ingredients_merged": 0,
        "recipe_links_moved": 0,
        "duplicate_recipe_links_deleted": 0,
        "blank_names_skipped": 0,
        "blank_names_deleted": 0,
    }

    with SessionLocal() as db:
        ingredients = db.execute(select(Ingredient).order_by(Ingredient.id.asc())).scalars().all()
        stats["ingredients_total"] = len(ingredients)

        by_clean_name: dict[str, list[tuple[Ingredient, str]]] = defaultdict(list)
        blank_ingredients: list[Ingredient] = []
        for ingredient in ingredients:
            clean_name = clean_ingredient_name(ingredient.name)
            if not clean_name:
                stats["blank_names_skipped"] += 1
                blank_ingredients.append(ingredient)
                continue
            by_clean_name[_db_name_key(clean_name)].append((ingredient, clean_name))
            if ingredient.name != clean_name:
                stats["ingredients_renamed"] += 1

        for ingredient in blank_ingredients:
            links = db.execute(
                select(RecipeIngredient).where(RecipeIngredient.ingredient_id == ingredient.id)
            ).scalars().all()
            for link in links:
                db.delete(link)
                stats["duplicate_recipe_links_deleted"] += 1
            db.delete(ingredient)
            stats["blank_names_deleted"] += 1

        pending_renames: list[tuple[Ingredient, str]] = []

        for _, group in by_clean_name.items():
            clean_name = sorted((name for _, name in group), key=_display_name_score)[0]
            group.sort(key=lambda item: (item[0].name != clean_name, _display_name_score(item[1]), item[0].id))
            canonical = group[0][0]
            duplicates = [item[0] for item in group[1:]]

            if canonical.name != clean_name:
                pending_renames.append((canonical, clean_name))

            for duplicate in duplicates:
                duplicate_links = db.execute(
                    select(RecipeIngredient).where(RecipeIngredient.ingredient_id == duplicate.id)
                ).scalars().all()

                for link in duplicate_links:
                    existing = db.execute(
                        select(RecipeIngredient).where(
                            RecipeIngredient.recipe_id == link.recipe_id,
                            RecipeIngredient.ingredient_id == canonical.id,
                        ).order_by(RecipeIngredient.id.asc())
                    ).scalars().first()

                    if existing:
                        db.delete(link)
                        stats["duplicate_recipe_links_deleted"] += 1
                    else:
                        link.ingredient_id = canonical.id
                        stats["recipe_links_moved"] += 1

                db.delete(duplicate)
                stats["ingredients_merged"] += 1

        db.flush()

        for ingredient, clean_name in pending_renames:
            ingredient.name = clean_name

        # Some recipes may already have duplicate ingredient links even without
        # ingredient-name merges. Keep the oldest link for each recipe/ingredient.
        links = db.execute(
            select(RecipeIngredient).order_by(
                RecipeIngredient.recipe_id.asc(),
                RecipeIngredient.ingredient_id.asc(),
                RecipeIngredient.id.asc(),
            )
        ).scalars().all()
        seen: set[tuple[int, int]] = set()
        for link in links:
            key = (link.recipe_id, link.ingredient_id)
            if key in seen:
                db.delete(link)
                stats["duplicate_recipe_links_deleted"] += 1
            else:
                seen.add(key)

        if dry_run:
            db.rollback()
        else:
            db.commit()

    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="Clean ingredient names and merge duplicates.")
    parser.add_argument("--dry-run", action="store_true", help="Report changes without writing to the database.")
    args = parser.parse_args()

    stats = clean_database(dry_run=args.dry_run)
    mode = "DRY RUN" if args.dry_run else "APPLIED"
    print(mode)
    for key, value in stats.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
