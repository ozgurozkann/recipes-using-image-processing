#!/usr/bin/env python3
"""
outputv2.json → MySQL import script.

Calistir (backend/ klasöründen):
    python import_recipes.py
    python import_recipes.py --limit 100   # test için
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models import Ingredient, IngredientCategory, Recipe, RecipeCategory, RecipeIngredient

# ── Birim tanımları ───────────────────────────────────────────────────────────

UNITS: list[tuple[str, str, float]] = [
    # (regex_pattern, normalized_unit, multiplier)
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

# Miktar sonrası gelen doldurucu kelimeler (ingredient adına dahil etme)
FILLER_RE = re.compile(r"^(dolusu|silme|kadar)\s+", re.IGNORECASE)

# Bölüm başlıkları: "Üzeri İçin:", "İç Pilav İçin:" vb.
SECTION_RE = re.compile(r"^.{0,40}için\s*:\s*$", re.IGNORECASE)

# ── Kategori tespiti ──────────────────────────────────────────────────────────

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


# ── Miktar & birim ayrıştırıcı ────────────────────────────────────────────────

def parse_qty(s: str) -> tuple[float, str]:
    """Başındaki sayıyı/kesri ayır. (qty, kalan_metin)"""
    s = s.strip()
    # "1 1/2 ..."
    m = re.match(r"^(\d+)\s+(\d+)/(\d+)\s+(.*)", s)
    if m:
        w, n, d, rest = m.groups()
        return int(w) + int(n) / int(d), rest.strip()
    # "1/2 ..."
    m = re.match(r"^(\d+)/(\d+)\s+(.*)", s)
    if m:
        n, d, rest = m.groups()
        return int(n) / int(d), rest.strip()
    # "2-3 ..."
    m = re.match(r"^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)\s+(.*)", s)
    if m:
        a, b, rest = m.groups()
        return (float(a.replace(",", ".")) + float(b.replace(",", "."))) / 2, rest.strip()
    # "500 ..."
    m = re.match(r"^(\d+(?:[.,]\d+)?)\s+(.*)", s)
    if m:
        n, rest = m.groups()
        return float(n.replace(",", ".")), rest.strip()
    return 1.0, s


def parse_unit(s: str) -> tuple[str, float, str]:
    """Başındaki birimi ayır. (unit, multiplier, kalan_metin)"""
    for pat, unit, mult in UNITS:
        m = re.match(r"^" + pat + r"\s*(.*)", s, re.IGNORECASE)
        if m:
            return unit, mult, m.group(1).strip()
    return "adet", 1, s


def parse_ingredient_line(line: str) -> tuple[str, float, str] | None:
    """Tek malzeme satırını (name, qty, unit) olarak döndür, geçersizse None."""
    line = line.strip()
    if not line:
        return None
    # Bölüm başlığı kontrolü
    if line.endswith(":") or SECTION_RE.match(line):
        return None

    qty, remaining = parse_qty(line)
    unit, mult, remaining = parse_unit(remaining)
    qty *= mult

    # Doldurucu kelimeleri kaldır
    remaining = FILLER_RE.sub("", remaining)

    name = remaining.strip(" ,.:;-").lower()
    # Unicode NFC normalize + collapse whitespace (önbellek tutarlılığı için)
    name = unicodedata.normalize("NFC", name)
    name = re.sub(r"\s+", " ", name).strip()
    if not name or len(name) < 2:
        return None

    return name[:120], round(qty, 4), unit


# ── JSON ayrıştırma ───────────────────────────────────────────────────────────

def parse_json(path: Path) -> list[dict]:
    """outputv2.json'ı okuyup tarif çiftlerini birleştirir."""
    data = json.loads(path.read_text("utf-8"))

    by_title: dict[str, dict] = {}

    for entry in data:
        text = re.sub(r"</?s>", "", entry.get("text", "")).strip()
        m = re.match(r"\[INST\]\s*(.+?)\s*\[/INST\]\s*(.*)", text, re.DOTALL)
        if not m:
            continue
        question, answer = m.group(1).strip(), m.group(2).strip()

        if "malzemeler nelerdir" in question:
            tm = re.match(r"^(.+?)\s+için\s+gerekli\s+malzemeler\s+nelerdir", question, re.IGNORECASE)
            if not tm:
                continue
            title = tm.group(1).strip()
            by_title.setdefault(title, {})
            by_title[title]["title"] = title
            by_title[title]["ingredients_text"] = answer

        elif "nasıl yapılır" in question:
            tm = re.match(r"^(.+?)\s+nasıl\s+yapılır", question, re.IGNORECASE)
            if not tm:
                continue
            title = tm.group(1).strip()
            by_title.setdefault(title, {})
            by_title[title]["title"] = title
            by_title[title]["instructions_text"] = answer

    # İkisi de olan tarif çiftleri
    return [v for v in by_title.values() if "ingredients_text" in v and "instructions_text" in v]


# ── Veritabanı importu ────────────────────────────────────────────────────────

def import_recipes(recipes: list[dict], batch_size: int = 200) -> tuple[int, int]:
    with SessionLocal() as db:
        # Kategori önbellekleri
        rc_cache: dict[str, int] = {
            rc.name: rc.id
            for rc in db.execute(select(RecipeCategory)).scalars()
        }

        # "Diğer" malzeme kategorisi
        other_ic = db.execute(
            select(IngredientCategory).where(IngredientCategory.name == "Diğer")
        ).scalar_one_or_none()
        if not other_ic:
            other_ic = IngredientCategory(name="Diğer")
            db.add(other_ic)
            db.flush()
        ic_other_id: int = other_ic.id

        # Mevcut malzemeleri önbellekle
        ing_cache: dict[str, int] = {
            ing.name.lower(): ing.id
            for ing in db.execute(select(Ingredient)).scalars()
        }

        # Mevcut tarif başlıklarını topla (tekrar ekleme)
        existing_titles: set[str] = set(db.execute(select(Recipe.title)).scalars())

        inserted = skipped = 0

        for i, rd in enumerate(recipes):
            title: str = rd["title"]

            if title in existing_titles:
                skipped += 1
                continue

            # Malzemeleri ayrıştır
            lines = [l.strip() for l in rd["ingredients_text"].split(",")]
            parsed = [parse_ingredient_line(l) for l in lines]
            parsed = [p for p in parsed if p]

            if not parsed:
                skipped += 1
                continue

            # Tarif kategorisi
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
                cooking_time=30,
                serving_count=4,
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
                key = ing_name  # already normalized + lowercased in parse_ingredient_line
                if key not in ing_cache:
                    try:
                        with db.begin_nested():  # savepoint — duplicate olursa sadece bu rollback
                            ing = Ingredient(name=ing_name, category_id=ic_other_id, unit_type=unit)
                            db.add(ing)
                            db.flush()
                        ing_cache[key] = ing.id
                    except IntegrityError:
                        # Başka bir tarif bu malzemeyi az önce ekledi; DB'den çek
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

    ap = argparse.ArgumentParser(description="outputv2.json tariflerini veritabanına aktar")
    ap.add_argument("--limit", type=int, default=None, help="Maksimum tarif sayısı (test için)")
    ap.add_argument("--json", default="../outputv2.json", help="JSON dosya yolu")
    args = ap.parse_args()

    json_path = Path(args.json)
    if not json_path.exists():
        print(f"HATA: {json_path} bulunamadı")
        sys.exit(1)

    print(f"JSON okunuyor: {json_path.resolve()}")
    recipes = parse_json(json_path)
    print(f"{len(recipes)} tarif çifti bulundu")

    if args.limit:
        recipes = recipes[: args.limit]
        print(f"Limit: ilk {len(recipes)} tarif alındı")

    print("Veritabanına aktarılıyor...\n")
    inserted, skipped = import_recipes(recipes)

    print(f"\nTamamlandı.")
    print(f"  Eklenen tarif : {inserted}")
    print(f"  Atlanan tarif : {skipped}")
