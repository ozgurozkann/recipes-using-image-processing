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

    # ── Ingredient categories ──────────────────────────────────────────────
    cat_names = [
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
    for name in cat_names:
        c = IngredientCategory(name=name)
        db.add(c)
        db.flush()
        cat_by_name[name] = c

    def add_ing(name: str, cat: str, unit_type: str = "adet") -> Ingredient:
        i = Ingredient(name=name, category_id=cat_by_name[cat].id, unit_type=unit_type)
        db.add(i)
        db.flush()
        return i

    # Sebzeler
    domates = add_ing("domates", "Sebzeler", "adet")
    sogan = add_ing("soğan", "Sebzeler", "adet")
    patates = add_ing("patates", "Sebzeler", "adet")
    havuc = add_ing("havuç", "Sebzeler", "adet")
    salatalik = add_ing("salatalık", "Sebzeler", "adet")
    brokoli = add_ing("brokoli", "Sebzeler", "adet")
    karnabahar = add_ing("karnabahar", "Sebzeler", "adet")
    lahana = add_ing("lahana", "Sebzeler", "adet")
    biber = add_ing("biber", "Sebzeler", "adet")
    patlican = add_ing("patlıcan", "Sebzeler", "adet")
    kabak = add_ing("kabak", "Sebzeler", "adet")
    ispanak = add_ing("ıspanak", "Sebzeler", "gram")
    maydanoz = add_ing("maydanoz", "Sebzeler", "gram")
    sarimsak = add_ing("sarımsak", "Sebzeler", "adet")
    kereviz = add_ing("kereviz", "Sebzeler", "adet")
    mantar = add_ing("mantar", "Sebzeler", "gram")
    misir = add_ing("mısır", "Sebzeler", "adet")

    # Meyveler
    limon = add_ing("limon", "Meyveler", "adet")
    add_ing("elma", "Meyveler", "adet")
    add_ing("portakal", "Meyveler", "adet")
    add_ing("nar", "Meyveler", "adet")

    # Et ürünleri
    kiyma = add_ing("kıyma", "Et ürünleri", "gram")
    dana_eti = add_ing("dana eti", "Et ürünleri", "gram")
    kuzu_eti = add_ing("kuzu eti", "Et ürünleri", "gram")
    sucuk = add_ing("sucuk", "Et ürünleri", "gram")

    # Tavuk ürünleri
    tavuk = add_ing("tavuk", "Tavuk ürünleri", "gram")
    tavuk_gogus = add_ing("tavuk göğsü", "Tavuk ürünleri", "gram")
    tavuk_but = add_ing("tavuk but", "Tavuk ürünleri", "gram")

    # Balık ürünleri
    somon = add_ing("somon", "Balık ürünleri", "gram")
    add_ing("levrek", "Balık ürünleri", "gram")
    add_ing("palamut", "Balık ürünleri", "gram")

    # Bakliyat
    mercimek = add_ing("mercimek", "Bakliyat", "gram")
    nohut = add_ing("nohut", "Bakliyat", "gram")
    fasulye = add_ing("fasulye", "Bakliyat", "gram")
    bulgur = add_ing("bulgur", "Bakliyat", "gram")
    pirinc = add_ing("pirinç", "Bakliyat", "gram")

    # Süt ürünleri
    yumurta = add_ing("yumurta", "Süt ürünleri", "adet")
    yogurt = add_ing("yoğurt", "Süt ürünleri", "gram")
    peynir = add_ing("beyaz peynir", "Süt ürünleri", "gram")
    kasar = add_ing("kaşar peyniri", "Süt ürünleri", "gram")
    sut = add_ing("süt", "Süt ürünleri", "ml")
    tereya = add_ing("tereyağı", "Süt ürünleri", "gram")
    krema = add_ing("krema", "Süt ürünleri", "ml")

    # Baharatlar
    tuz = add_ing("tuz", "Baharatlar", "gram")
    karabiber = add_ing("karabiber", "Baharatlar", "gram")
    kirmizi_biber = add_ing("pul biber", "Baharatlar", "gram")
    kekik = add_ing("kekik", "Baharatlar", "gram")
    kimyon = add_ing("kimyon", "Baharatlar", "gram")
    kurkuma = add_ing("zerdeçal", "Baharatlar", "gram")
    tarçın = add_ing("tarçın", "Baharatlar", "gram")

    # Temel gıdalar
    zeytinyagi = add_ing("zeytinyağı", "Temel gıdalar", "ml")
    un = add_ing("un", "Temel gıdalar", "gram")
    seker = add_ing("şeker", "Temel gıdalar", "gram")
    ekmek = add_ing("ekmek", "Temel gıdalar", "dilim")
    makarna = add_ing("makarna", "Temel gıdalar", "gram")
    domates_salca = add_ing("domates salçası", "Temel gıdalar", "gram")
    sivi_yag = add_ing("sıvı yağ", "Temel gıdalar", "ml")

    # ── Recipe categories ──────────────────────────────────────────────────
    rc_names = ["Kahvaltı", "Ana yemek", "Çorba", "Meze", "Salata", "Tatlı", "Sos"]
    rc_by_name: dict[str, RecipeCategory] = {}
    for name in rc_names:
        rc = RecipeCategory(name=name)
        db.add(rc)
        db.flush()
        rc_by_name[name] = rc

    def add_recipe(
        title: str,
        cat: str,
        ings: list[tuple[Ingredient, float, str]],
        steps: list[str],
        time: int = 20,
        serving: int = 2,
        difficulty: str = "easy",
        description: str = "",
    ) -> None:
        r = Recipe(
            title=title,
            description=description,
            instructions="\n".join(steps),
            cooking_time=time,
            serving_count=serving,
            difficulty=difficulty,
            category_id=rc_by_name[cat].id,
            image_url="",
            created_by_user_id=None,
            is_approved=True,
            favorite_count=0,
            save_count=0,
        )
        db.add(r)
        db.flush()
        for ing, qty, unit in ings:
            db.add(RecipeIngredient(recipe_id=r.id, ingredient_id=ing.id, quantity=qty, unit=unit))

    # ── Recipes ────────────────────────────────────────────────────────────
    add_recipe(
        "Domatesli Soğanlı Omlet",
        "Kahvaltı",
        [(yumurta, 3, "adet"), (domates, 2, "adet"), (sogan, 1, "adet"), (tuz, 2, "gram"), (karabiber, 1, "gram"), (zeytinyagi, 15, "ml")],
        ["Soğanı doğrayıp zeytinyağında kavurun.", "Domatesi küp doğrayıp ekleyin, 2 dk pişirin.", "Yumurtaları kırın, tuz-biber ekleyin ve pişirin."],
        time=15, serving=2, description="Klasik Türk kahvaltısı omleti.",
    )

    add_recipe(
        "Havuçlu Yoğurt Mezesi",
        "Meze",
        [(havuc, 2, "adet"), (yogurt, 250, "gram"), (sarimsak, 2, "adet"), (tuz, 2, "gram"), (zeytinyagi, 10, "ml"), (kekik, 1, "gram")],
        ["Havuçları rendeleyin.", "Sarımsakları ezin.", "Yoğurtla karıştırın, üstüne zeytinyağı gezdirin."],
        time=10, serving=4, description="Soğuk servis edilen sağlıklı meze.",
    )

    add_recipe(
        "Mercimek Çorbası",
        "Çorba",
        [(mercimek, 200, "gram"), (sogan, 1, "adet"), (patates, 1, "adet"), (havuc, 1, "adet"), (tuz, 3, "gram"), (kimyon, 2, "gram"), (kirmizi_biber, 1, "gram"), (zeytinyagi, 20, "ml")],
        ["Soğanı kavurun.", "Havuç ve patatesi ekleyin.", "Yıkanmış mercimeği ekleyin, su ilave edin.", "Pişince blendırdan geçirin.", "Servis öncesi kimyon ve pul biber ile tatlandırın."],
        time=35, serving=4, difficulty="easy", description="Geleneksel Türk mercimek çorbası.",
    )

    add_recipe(
        "Tavuk Sote",
        "Ana yemek",
        [(tavuk_gogus, 500, "gram"), (sogan, 1, "adet"), (biber, 2, "adet"), (domates, 2, "adet"), (sarimsak, 2, "adet"), (tuz, 3, "gram"), (karabiber, 2, "gram"), (kekik, 2, "gram"), (zeytinyagi, 30, "ml")],
        ["Tavuğu parçalayın.", "Zeytinyağında soğanı soteleyin.", "Tavuğu ekleyip mühürleyin.", "Biber ve sarımsağı ekleyin.", "Domatesleri ilave edin, 15 dk pişirin."],
        time=30, serving=4, difficulty="easy", description="Pratik ve lezzetli tavuk yemeği.",
    )

    add_recipe(
        "Kıymalı Patates",
        "Ana yemek",
        [(kiyma, 300, "gram"), (patates, 4, "adet"), (sogan, 1, "adet"), (domates_salca, 30, "gram"), (tuz, 3, "gram"), (karabiber, 2, "gram"), (sivi_yag, 30, "ml")],
        ["Kıymayı kavurun.", "Soğanı ekleyin.", "Salçayı ekleyin.", "Patates küplerini ilave edin.", "Su ekleyip 20 dk pişirin."],
        time=40, serving=4, difficulty="easy", description="Doyurucu bir ana yemek.",
    )

    add_recipe(
        "İspanaklı Yumurta",
        "Ana yemek",
        [(ispanak, 500, "gram"), (yumurta, 4, "adet"), (sogan, 1, "adet"), (sarimsak, 2, "adet"), (tuz, 2, "gram"), (karabiber, 1, "gram"), (zeytinyagi, 20, "ml")],
        ["Ispanağı yıkayıp doğrayın.", "Zeytinyağında sarımsak ve soğanı soteleyin.", "Ispanağı ekleyin, suyunu çekin.", "Yumurtaları kırın üzerine, kapağı kapatın."],
        time=20, serving=2, description="Sağlıklı ve hafif öğün.",
    )

    add_recipe(
        "Bulgur Pilavı",
        "Ana yemek",
        [(bulgur, 250, "gram"), (sogan, 1, "adet"), (domates, 1, "adet"), (domates_salca, 15, "gram"), (tuz, 3, "gram"), (tereya, 30, "gram"), (sivi_yag, 20, "ml")],
        ["Soğanı yağda kavurun.", "Salça ve domatesi ekleyin.", "Bulguru ekleyip kavurun.", "Sıcak su ekleyin (2 kat bulgur), kapağı kapatın.", "Kısık ateşte 15 dk pişirin."],
        time=25, serving=4, description="Geleneksel Türk bulgur pilavı.",
    )

    add_recipe(
        "Fırında Somon",
        "Ana yemek",
        [(somon, 400, "gram"), (limon, 1, "adet"), (sarimsak, 2, "adet"), (zeytinyagi, 30, "ml"), (tuz, 3, "gram"), (karabiber, 2, "gram"), (kekik, 2, "gram")],
        ["Somon filetoyu yıkayıp kurulayın.", "Üzerine zeytinyağı, limon, sarımsak, tuz-biber sürün.", "180°C fırında 20 dk pişirin."],
        time=30, serving=2, difficulty="easy", description="Sağlıklı fırın balığı.",
    )

    add_recipe(
        "Şakşuka",
        "Meze",
        [(patlican, 2, "adet"), (biber, 2, "adet"), (domates, 2, "adet"), (sarimsak, 2, "adet"), (tuz, 2, "gram"), (zeytinyagi, 30, "ml"), (kirmizi_biber, 1, "gram")],
        ["Patlıcan ve biberi doğrayıp kızartın.", "Sarımsak ve domatesi ekleyin.", "5 dk pişirin, soğuk servis edin."],
        time=25, serving=4, description="Klasik Türk mezesi.",
    )

    add_recipe(
        "Domates Çorbası",
        "Çorba",
        [(domates, 6, "adet"), (sogan, 1, "adet"), (sarimsak, 2, "adet"), (tereya, 20, "gram"), (krema, 50, "ml"), (tuz, 3, "gram"), (karabiber, 1, "gram"), (seker, 5, "gram")],
        ["Soğan ve sarımsağı tereyağında kavurun.", "Domatesleri ekleyin, 10 dk pişirin.", "Blendırdan geçirin.", "Kremayı ekleyip karıştırın."],
        time=30, serving=4, description="Kremali domates çorbası.",
    )

    add_recipe(
        "Nohut Yemeği",
        "Ana yemek",
        [(nohut, 300, "gram"), (sogan, 1, "adet"), (domates_salca, 30, "gram"), (tuz, 3, "gram"), (kimyon, 2, "gram"), (sivi_yag, 30, "ml"), (kirmizi_biber, 1, "gram")],
        ["Nohudu önceden ıslatıp haşlayın.", "Soğanı kavurun, salça ekleyin.", "Nohudu ekleyin.", "Baharatları ilave edin, 15 dk pişirin."],
        time=90, serving=4, difficulty="medium", description="Besleyici nohut yemeği.",
    )

    add_recipe(
        "Sucuklu Yumurta",
        "Kahvaltı",
        [(sucuk, 100, "gram"), (yumurta, 3, "adet"), (tuz, 1, "gram"), (karabiber, 1, "gram")],
        ["Sucuğu dilimleyin ve tavada yağsız kavurun.", "Yumurtaları kırın.", "Kısık ateşte pişirin."],
        time=10, serving=2, description="Hızlı kahvaltı.",
    )

    add_recipe(
        "Makarnanın Soslu",
        "Ana yemek",
        [(makarna, 300, "gram"), (domates_salca, 40, "gram"), (sogan, 1, "adet"), (sarimsak, 2, "adet"), (karabiber, 2, "gram"), (kekik, 2, "gram"), (tuz, 3, "gram"), (zeytinyagi, 20, "ml")],
        ["Makarnayı haşlayın.", "Soğan ve sarımsağı zeytinyağında kavurun.", "Salçayı ekleyin.", "Makarnayı sos ile karıştırın."],
        time=25, serving=4, description="Temel domates soslu makarna.",
    )

    add_recipe(
        "Çoban Salatası",
        "Salata",
        [(domates, 3, "adet"), (salatalik, 2, "adet"), (sogan, 1, "adet"), (biber, 2, "adet"), (maydanoz, 20, "gram"), (zeytinyagi, 20, "ml"), (limon, 1, "adet"), (tuz, 2, "gram")],
        ["Tüm sebzeleri ince doğrayın.", "Maydanozu ekleyin.", "Zeytinyağı, limon ve tuz ile karıştırın."],
        time=10, serving=4, description="Taze ve hafif Türk salatası.",
    )

    add_recipe(
        "Kabak Mücveri",
        "Meze",
        [(kabak, 3, "adet"), (yumurta, 2, "adet"), (un, 60, "gram"), (peynir, 100, "gram"), (maydanoz, 20, "gram"), (tuz, 2, "gram"), (karabiber, 1, "gram"), (sivi_yag, 100, "ml")],
        ["Kabakları rendeleyin, tuz ekleyip suyunu sıkın.", "Yumurta, un, peynir ve maydanozu ekleyin.", "Yağda her iki taraftan kızartın."],
        time=30, serving=4, description="Geleneksel Türk mücveri.",
    )

    add_recipe(
        "Tavuklu Pirinç Pilavı",
        "Ana yemek",
        [(pirinc, 300, "gram"), (tavuk, 400, "gram"), (sogan, 1, "adet"), (tuz, 3, "gram"), (karabiber, 2, "gram"), (tereya, 30, "gram")],
        ["Pirinçi yıkayıp ıslatın.", "Tavuğu haşlayın, suyunu saklayın.", "Soğanı tereyağında kavurun.", "Pirinç ve tavuk suyunu ekleyin.", "Pişince tavuk parçalarını ilave edin."],
        time=45, serving=4, difficulty="medium", description="Tam bir Türk klasiği.",
    )

    db.commit()
