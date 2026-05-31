from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Ingredient, IngredientCategory, Recipe, RecipeCategory, RecipeIngredient, User
from .security import hash_password


def seed_if_empty(db: Session) -> None:
    has_any = db.execute(select(User).limit(1)).scalar_one_or_none()
    if not has_any:
        db.add(
            User(
                full_name="Admin",
                email="admin@example.com",
                password_hash=hash_password("admin1234"),
                role="admin",
            )
        )
        db.commit()

    if db.execute(select(IngredientCategory).limit(1)).scalar_one_or_none():
        return

    categories = [
        "Sebzeler",
        "Meyveler",
        "Et ürünleri",
        "Tavuk ürünleri",
        "Balık ürünleri",
        "Bakliyat",
        "Süt ürünleri",
        "Baharatlar",
        "Temel gıdalar",
    ]
    cat_by_name: dict[str, IngredientCategory] = {}
    for name in categories:
        c = IngredientCategory(name=name)
        db.add(c)
        db.flush()
        cat_by_name[name] = c

    def add_ing(name: str, cat: str, unit_type: str = "adet") -> Ingredient:
        i = Ingredient(name=name, category_id=cat_by_name[cat].id, unit_type=unit_type)
        db.add(i)
        db.flush()
        return i

    domates = add_ing("domates", "Sebzeler", "adet")
    sogan = add_ing("soğan", "Sebzeler", "adet")
    patates = add_ing("patates", "Sebzeler", "adet")
    havuc = add_ing("havuç", "Sebzeler", "adet")
    add_ing("salatalık", "Sebzeler", "adet")
    add_ing("brokoli", "Sebzeler", "adet")
    add_ing("karnabahar", "Sebzeler", "adet")
    add_ing("lahana", "Sebzeler", "adet")
    add_ing("biber", "Sebzeler", "adet")
    yumurta = add_ing("yumurta", "Temel gıdalar", "adet")
    yogurt = add_ing("yoğurt", "Süt ürünleri", "gram")
    sarimsak = add_ing("sarımsak", "Sebzeler", "adet")
    zeytinyagi = add_ing("zeytinyağı", "Temel gıdalar", "ml")
    tuz = add_ing("tuz", "Baharatlar", "gram")
    karabiber = add_ing("karabiber", "Baharatlar", "gram")

    recipe_cats = ["Kahvaltı", "Ana yemek", "Meze", "Sos"]
    rc_by_name: dict[str, RecipeCategory] = {}
    for name in recipe_cats:
        rc = RecipeCategory(name=name)
        db.add(rc)
        db.flush()
        rc_by_name[name] = rc

    def add_recipe(title: str, cat: str, ingredients: list[tuple[Ingredient, float, str]], instructions: list[str]) -> None:
        r = Recipe(
            title=title,
            description="",
            instructions="\n".join(instructions),
            cooking_time=15,
            serving_count=2,
            difficulty="easy",
            category_id=rc_by_name[cat].id,
            image_url="",
            created_by_user_id=None,
            is_approved=True,
            favorite_count=0,
            save_count=0,
        )
        db.add(r)
        db.flush()
        for ing, qty, unit in ingredients:
            db.add(RecipeIngredient(recipe_id=r.id, ingredient_id=ing.id, quantity=qty, unit=unit))

    add_recipe(
        "Domatesli Soğanlı Omlet",
        "Kahvaltı",
        [(yumurta, 3, "adet"), (domates, 2, "adet"), (sogan, 1, "adet"), (tuz, 2, "gram"), (karabiber, 1, "gram")],
        ["Soğanı doğrayıp az yağda yumuşatın.", "Domatesi ekleyin.", "Yumurtayı ekleyip pişirin."],
    )
    add_recipe(
        "Havuçlu Yoğurt Mezesi",
        "Meze",
        [(havuc, 2, "adet"), (yogurt, 250, "gram"), (sarimsak, 1, "adet"), (tuz, 2, "gram"), (zeytinyagi, 10, "ml")],
        ["Havuçları rendeleyip soteleyin.", "Soğutup yoğurtla karıştırın.", "Üstüne az yağ gezdirin."],
    )

    db.commit()
