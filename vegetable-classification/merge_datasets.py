import os
import re
import shutil
import random
from pathlib import Path

random.seed(42)

# ── Kaynak yollar ──────────────────────────────────────────────────────────────
VEGETABLE_BASE = Path("dataset/Vegetable Images")
FRUITS_BASE    = Path(r"C:\Users\emrea\Desktop\görüntü işleme\fruits-360_100x100\fruits-360")
OUTPUT_BASE    = Path("dataset/merged_dataset")

VAL_SPLIT = 0.15   # Fruits-360 Training'den validation oranı

# ── Çakışan sınıf eşlemeleri (fruits-360 → vegetable canonical) ──────────────
# Temel kural: normalize edilmiş fruits ismi bu prefix'lerden biriyle başlıyorsa
# sağdaki vegetable sınıf ismine map'le.
PREFIX_MAP = {
    "Eggplant":    "Brinjal",
    "Pepper":      "Capsicum",
    "Tomato":      "Tomato",
    "Carrot":      "Carrot",
    "Cauliflower": "Cauliflower",
    "Cucumber":    "Cucumber",
    "Cabbage":     "Cabbage",
    "Papaya":      "Papaya",
    "Potato":      "Potato",
    "Onion":       "Onion",
    "Corn":        "Corn",
}


def canonical_name(folder_name: str) -> str:
    """Fruits-360 klasör ismini → canonical sınıf ismine çevirir."""
    base = re.sub(r"\s+\d+$", "", folder_name).strip()   # trailing " N" kaldır
    for prefix, target in PREFIX_MAP.items():
        if base.lower().startswith(prefix.lower()):
            return target
    return base.replace(" ", "_")


def safe_filename(folder: str, filename: str) -> str:
    """Farklı klasörlerden gelen aynı isimli dosyalar çakışmasın diye prefix ekle."""
    prefix = re.sub(r"[^\w]", "_", folder)
    return f"{prefix}_{filename}"


def copy_folder(src: Path, dst: Path, prefix: str = "") -> int:
    dst.mkdir(parents=True, exist_ok=True)
    count = 0
    for f in src.iterdir():
        if f.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        new_name = safe_filename(prefix, f.name) if prefix else f.name
        target = dst / new_name
        # Çakışma varsa sayaç ekle
        if target.exists():
            stem, ext = target.stem, target.suffix
            c = 1
            while (dst / f"{stem}_{c}{ext}").exists():
                c += 1
            target = dst / f"{stem}_{c}{ext}"
        shutil.copy2(f, target)
        count += 1
    return count


def main():
    if OUTPUT_BASE.exists():
        print(f"Eski merged_dataset siliniyor: {OUTPUT_BASE}")
        shutil.rmtree(OUTPUT_BASE)

    for split in ("train", "validation", "test"):
        (OUTPUT_BASE / split).mkdir(parents=True, exist_ok=True)

    stats = {"train": 0, "validation": 0, "test": 0}
    all_classes: set[str] = set()

    # ── 1. Vegetable dataset (train / validation / test) ──────────────────────
    print("\n=== Vegetable dataset kopyalanıyor ===")
    for src_split, dst_split in [("train", "train"), ("validation", "validation"), ("test", "test")]:
        for cls_dir in sorted((VEGETABLE_BASE / src_split).iterdir()):
            if not cls_dir.is_dir():
                continue
            n = copy_folder(cls_dir, OUTPUT_BASE / dst_split / cls_dir.name)
            stats[dst_split] += n
            all_classes.add(cls_dir.name)
            print(f"  [{dst_split}] {cls_dir.name}: {n}")

    # ── 2. Fruits-360 Training → train + validation split ─────────────────────
    print("\n=== Fruits-360 Training kopyalanıyor ===")
    fruits_train = FRUITS_BASE / "Training"
    for folder in sorted(fruits_train.iterdir()):
        if not folder.is_dir():
            continue
        cls = canonical_name(folder.name)
        all_classes.add(cls)

        images = [f for f in folder.iterdir() if f.suffix.lower() in {".jpg", ".jpeg", ".png"}]
        random.shuffle(images)

        n_val = int(len(images) * VAL_SPLIT)
        val_set = set(f.name for f in images[:n_val])
        prefix  = re.sub(r"[^\w]", "_", folder.name)

        for img in images:
            split = "validation" if img.name in val_set else "train"
            dst_dir = OUTPUT_BASE / split / cls
            dst_dir.mkdir(parents=True, exist_ok=True)
            new_name = safe_filename(prefix, img.name)
            target   = dst_dir / new_name
            if target.exists():
                stem, ext = target.stem, target.suffix
                c = 1
                while (dst_dir / f"{stem}_{c}{ext}").exists():
                    c += 1
                target = dst_dir / f"{stem}_{c}{ext}"
            shutil.copy2(img, target)
            stats[split] += 1

        print(f"  {folder.name} → [{cls}]: train={len(images)-n_val}, val={n_val}")

    # ── 3. Fruits-360 Test ────────────────────────────────────────────────────
    print("\n=== Fruits-360 Test kopyalanıyor ===")
    fruits_test = FRUITS_BASE / "Test"
    for folder in sorted(fruits_test.iterdir()):
        if not folder.is_dir():
            continue
        cls    = canonical_name(folder.name)
        prefix = re.sub(r"[^\w]", "_", folder.name)
        n      = copy_folder(folder, OUTPUT_BASE / "test" / cls, prefix=prefix)
        stats["test"] += n
        print(f"  {folder.name} → [{cls}]: {n}")

    # ── Sınıf isimlerini kaydet ───────────────────────────────────────────────
    labels_path = OUTPUT_BASE / "labels.txt"
    sorted_classes = sorted(all_classes)
    with open(labels_path, "w", encoding="utf-8") as f:
        for c in sorted_classes:
            f.write(c + "\n")
    print(f"\nEtiketler kaydedildi: {labels_path}")

    # ── Özet ─────────────────────────────────────────────────────────────────
    print("\n" + "=" * 50)
    print(f"Toplam sınıf sayısı : {len(all_classes)}")
    print(f"Train görüntü       : {stats['train']:,}")
    print(f"Validation görüntü  : {stats['validation']:,}")
    print(f"Test görüntü        : {stats['test']:,}")
    print(f"Toplam görüntü      : {sum(stats.values()):,}")
    print(f"Çıktı klasörü       : {OUTPUT_BASE.resolve()}")


if __name__ == "__main__":
    main()
