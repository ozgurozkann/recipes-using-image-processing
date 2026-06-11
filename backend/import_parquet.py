#!/usr/bin/env python3
"""
train-00000-of-00001.parquet → MySQL import script.

Çalıştır (backend/ klasöründen):
    python import_parquet.py
    python import_parquet.py --limit 100   # test için
    python import_parquet.py --parquet ../train-00000-of-00001.parquet
"""
from __future__ import annotations

import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import pandas as pd
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models import Ingredient, IngredientCategory, Recipe, RecipeCategory, RecipeIngredient
from app.utils.ingredient_names import clean_ingredient_name

# ── Birim tanımları ───────────────────────────────────────────────────────────

UNITS: list[tuple[str, str, float]] = [
    (r"su\s*bardağı",   "su bardağı",   1),
    (r"çay\s*bardağı",  "çay bardağı",  1),
    (r"yemek\s*kaşığı", "yemek kaşığı", 1),
    (r"tatlı\s*kaşığı", "tatlı kaşığı", 1),
    (r"çay\s*kaşığı",   "çay kaşığı",   1),
    (r"kg\b",           "gram",         1000),
    (r"gram\b",         "gram",         1),
    (r"gr\b",           "gram",         1),
    (r"litre\b",        "ml",           1000),
    (r"lt\b",           "ml",           1000),
    (r"ml\b",           "ml",           1),
    (r"cc\b",           "ml",           1),
    (r"adet\b",         "adet",         1),
    (r"diş\b",          "diş",          1),
    (r"demet\b",        "demet",        1),
    (r"dal\b",          "dal",          1),
    (r"tutam\b",        "tutam",        1),
    (r"dilim\b",        "dilim",        1),
    (r"paket\b",        "paket",        1),
    (r"kutu\b",         "kutu",         1),
    (r"avuç\b",         "avuç",         1),
    (r"baş\b",          "baş",          1),
    (r"sap\b",          "sap",          1),
    (r"şişe\b",         "şişe",         1),
    (r"porsiyon\b",     "porsiyon",     1),
]

FILLER_RE = re.compile(r"^(dolusu|silme|kadar)\s+", re.IGNORECASE)
SECTION_RE = re.compile(r"^.{0,40}için\s*:\s*$", re.IGNORECASE)

CATEGORY_KEYWORDS: list[tuple[str, list[str]]] = [
    ("Çorba",    ["çorba"]),
    ("Salata",   ["salata"]),
    ("Tatlı",    ["tatlı", "kurabiye", "kek", "pasta", "sütlaç", "muhallebi",
                  "baklava", "helva", "puding", "komposto", "reçel"]),
    ("Kahvaltı", ["kahvaltı", "omlet", "menemen", "gözleme", "poğaça"]),
    ("Meze",     ["meze", "cacık", "haydari", "ezme", "hummus", "tarator"]),
    ("Sos",      [" sos", "salça"]),
]


def detect_category(title: str) -> str:
    t = title.lower()
    for cat, kws in CATEGORY_KEYWORDS:
        if any(k in t for k in kws):
            return cat
    return "Ana yemek"


def parse_qty(s: str) -> tuple[float, str]:
    s = s.strip()
    m = re.match(r"^(\d+)\s+(\d+)/(\d+)\s+(.*)", s)
    if m:
        w, n, d, rest = m.groups()
        return int(w) + int(n) / int(d), rest.strip()
    m = re.match(r"^(\d+)/(\d+)\s+(.*)", s)
    if m:
        n, d, rest = m.groups()
        return int(n) / int(d), rest.strip()
    m = re.match(r"^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)\s+(.*)", s)
    if m:
        a, b, rest = m.groups()
        return (float(a.replace(",", ".")) + float(b.replace(",", "."))) / 2, rest.strip()
    m = re.match(r"^(\d+(?:[.,]\d+)?)\s+(.*)", s)
    if m:
        n, rest = m.groups()
        return float(n.replace(",", ".")), rest.strip()
    return 1.0, s


def parse_unit(s: str) -> tuple[str, float, str]:
    for pat, unit, mult in UNITS:
        m = re.match(r"^" + pat + r"\s*(.*)", s, re.IGNORECASE)
        if m:
            return unit, mult, m.group(1).strip()
    return "adet", 1, s


def parse_ingredient_line(line: str) -> tuple[str, float, str] | None:
    line = line.strip()
    if not line:
        return None
    if line.endswith(":") or SECTION_RE.match(line):
        return None

    qty, remaining = parse_qty(line)
    unit, mult, remaining = parse_unit(remaining)
    qty *= mult

    remaining = FILLER_RE.sub("", remaining)
    name = clean_ingredient_name(unicodedata.normalize("NFC", remaining))
    if not name or len(name) < 2:
        return None

    return name[:120], round(qty, 4), unit


def parse_serving(s: str) -> int:
    """'6 kişilik' veya '10 dilim' → int."""
    m = re.search(r"(\d+)", str(s))
    return int(m.group(1)) if m else 4


def parse_minutes(s: str) -> int:
    """'45 dakika' veya '1 saat 30 dakika' → toplam dakika."""
    s = str(s).lower()
    total = 0
    m = re.search(r"(\d+)\s*saat", s)
    if m:
        total += int(m.group(1)) * 60
    m = re.search(r"(\d+)\s*dakika", s)
    if m:
        total += int(m.group(1))
    return total if total > 0 else 30


# ── Parquet okuma ─────────────────────────────────────────────────────────────

def load_parquet(path: Path) -> list[dict]:
    df = pd.read_parquet(path)
    recipes = []
    for _, row in df.iterrows():
        title = str(row["isim"]).strip()
        ingredients_text = str(row["malzemeler"]).strip()
        instructions_text = str(row["tarif"]).strip()
        serving_count = parse_serving(row.get("kac_kisilik", "4"))
        prep_min = parse_minutes(row.get("hazirlama_suresi", "0"))
        cook_min = parse_minutes(row.get("pisirme_suresi", "30"))
        cooking_time = prep_min + cook_min

        if not title or not ingredients_text or not instructions_text:
            continue

        recipes.append({
            "title": title,
            "ingredients_text": ingredients_text,
            "instructions_text": instructions_text,
            "serving_count": serving_count,
            "cooking_time": cooking_time,
        })
    return recipes


# ── Veritabanı importu ────────────────────────────────────────────────────────

def import_recipes(recipes: list[dict], batch_size: int = 200) -> tuple[int, int]:
    with SessionLocal() as db:
        rc_cache: dict[str, int] = {
            rc.name: rc.id
            for rc in db.execute(select(RecipeCategory)).scalars()
        }

        other_ic = db.execute(
            select(IngredientCategory).where(IngredientCategory.name == "Diğer")
        ).scalar_one_or_none()
        if not other_ic:
            other_ic = IngredientCategory(name="Diğer")
            db.add(other_ic)
            db.flush()
        ic_other_id: int = other_ic.id

        ing_cache: dict[str, int] = {
            ing.name.lower(): ing.id
            for ing in db.execute(select(Ingredient)).scalars()
        }

        existing_titles: set[str] = set(db.execute(select(Recipe.title)).scalars())

        inserted = skipped = 0

        for i, rd in enumerate(recipes):
            title: str = rd["title"]

            if title in existing_titles:
                skipped += 1
                continue

            lines = [l.strip() for l in rd["ingredients_text"].split(",")]
            parsed = [parse_ingredient_line(l) for l in lines]
            parsed = [p for p in parsed if p]

            if not parsed:
                skipped += 1
                continue

            cat_name = detect_category(title)
            if cat_name not in rc_cache:
                rc = RecipeCategory(name=cat_name)
                db.add(rc)
                db.flush()
                rc_cache[cat_name] = rc.id

            difficulty = "hard" if len(parsed) > 15 else ("medium" if len(parsed) > 8 else "easy")

            recipe = Recipe(
                title=title,
                description="",
                instructions=rd["instructions_text"].strip(),
                cooking_time=rd["cooking_time"],
                serving_count=rd["serving_count"],
                difficulty=difficulty,
                category_id=rc_cache[cat_name],
                image_url="",
                created_by_user_id=None,
                is_approved=True,
                favorite_count=0,
                save_count=0,
            )
            db.add(recipe)
            db.flush()
            existing_titles.add(title)

            for ing_name, qty, unit in parsed:
                key = ing_name
                if key not in ing_cache:
                    try:
                        with db.begin_nested():
                            ing = Ingredient(name=ing_name, category_id=ic_other_id, unit_type=unit)
                            db.add(ing)
                            db.flush()
                        ing_cache[key] = ing.id
                    except IntegrityError:
                        existing = db.execute(
                            select(Ingredient).where(Ingredient.name == ing_name)
                        ).scalar_one()
                        ing_cache[key] = existing.id
                db.add(RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_id=ing_cache[key],
                    quantity=qty,
                    unit=unit,
                ))

            inserted += 1

            if (i + 1) % batch_size == 0:
                db.commit()
                pct = (i + 1) / len(recipes) * 100
                print(f"  [{pct:5.1f}%] {i+1}/{len(recipes)} — eklenen: {inserted}, atlanan: {skipped}")

        db.commit()
        return inserted, skipped


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="Parquet tariflerini veritabanına aktar")
    ap.add_argument("--limit", type=int, default=None, help="Maksimum tarif sayısı (test için)")
    ap.add_argument("--parquet", default="../train-00000-of-00001.parquet", help="Parquet dosya yolu")
    args = ap.parse_args()

    parquet_path = Path(args.parquet)
    if not parquet_path.exists():
        print(f"HATA: {parquet_path} bulunamadı")
        sys.exit(1)

    print(f"Parquet okunuyor: {parquet_path.resolve()}")
    recipes = load_parquet(parquet_path)
    print(f"{len(recipes)} tarif bulundu")

    if args.limit:
        recipes = recipes[: args.limit]
        print(f"Limit: ilk {len(recipes)} tarif alındı")

    print("Veritabanına aktarılıyor...\n")
    inserted, skipped = import_recipes(recipes)

    print(f"\nTamamlandı.")
    print(f"  Eklenen tarif : {inserted}")
    print(f"  Atlanan tarif : {skipped}")
