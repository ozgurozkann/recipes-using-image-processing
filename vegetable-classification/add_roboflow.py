import csv
import re
import shutil
from pathlib import Path

random_seed = 42

ROBOFLOW_BASE = Path(r"C:\Users\emrea\Desktop\görüntü işleme 2")
MERGED_BASE   = Path("dataset/merged_dataset")

# Roboflow sınıf adı → merged_dataset canonical sınıf adı
ROBOFLOW_CLASS_MAP = {
    "Bitter_Gourd_new":    "Bitter_Gourd",
    "Bottle_Gourd_new":    "Bottle_Gourd",
    "Brinjal_new":         "Brinjal",
    "Capsicum_new":        "Capsicum",
    "Cucumber_new":        "Cucumber",
    "Tomato_new":          "Tomato",
    "apple":               "Apple",
    "apple_rotten":        "Apple",
    "banana":              "Banana",
    "banana_rotten":       "Banana",
    "capsicum":            "Capsicum",
    "capsicum_rotten":     "Capsicum",
    "guava":               "Guava",
    "guava_rotten":        "Guava",
    "lemon":               "Lemon",
    "mango":               "Mango",
    "mango_rotten":        "Mango",
    "orange":              "Orange",
    "orange_rotten":       "Orange",
    "pomegranate":         "Pomegranate",
    "pomegranate_rotten":  "Pomegranate",
    "strawberry":          "Strawberry",
    "strawberry_rotten":   "Strawberry",
    "tomato":              "Tomato",
    "tomato_rotten":       "Tomato",
}


def safe_filename(prefix: str, filename: str) -> str:
    p = re.sub(r"[^\w]", "_", prefix)
    return f"{p}_{filename}"


def _unique_target(dst_dir: Path, name: str) -> Path:
    target = dst_dir / name
    if not target.exists():
        return target
    stem, ext = Path(name).stem, Path(name).suffix
    c = 1
    while (dst_dir / f"{stem}_{c}{ext}").exists():
        c += 1
    return dst_dir / f"{stem}_{c}{ext}"


def copy_from_roboflow_csv(
    csv_path: Path,
    img_dir: Path,
    dst_split: str,
    stats: dict,
    new_classes: set,
) -> None:
    if not csv_path.exists():
        print(f"  [UYARI] CSV bulunamadı: {csv_path}")
        return

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        # CSV başlıklarındaki whitespace'i temizle
        raw_fields = reader.fieldnames or []
        stripped_fields = [c.strip() for c in raw_fields]
        col_names = [c for c in stripped_fields if c != "filename"]

        skipped = 0
        for row in reader:
            # Satır key'lerini de strip'le
            row = {k.strip(): v.strip() for k, v in row.items()}
            filename = row.get("filename", "")
            src = img_dir / filename
            if not src.exists():
                skipped += 1
                continue

            # one-hot → aktif sınıfı bul
            active = [c for c in col_names if row.get(c, "") == "1"]
            if len(active) != 1:
                skipped += 1
                continue

            raw_cls = active[0]
            cls = ROBOFLOW_CLASS_MAP.get(raw_cls, raw_cls)

            dst_dir_path = MERGED_BASE / dst_split / cls
            dst_dir_path.mkdir(parents=True, exist_ok=True)

            new_name = safe_filename("rfv", filename)
            target   = _unique_target(dst_dir_path, new_name)
            shutil.copy2(src, target)

            stats[dst_split] += 1
            new_classes.add(cls)

    if skipped:
        print(f"  [{dst_split}] {skipped} satır atlandı (dosya yok / çoklu etiket)")


def main():
    if not MERGED_BASE.exists():
        print(f"HATA: merged_dataset bulunamadı: {MERGED_BASE.resolve()}")
        print("Önce merge_datasets.py çalıştırın.")
        return

    stats: dict[str, int] = {"train": 0, "validation": 0, "test": 0}
    new_classes: set[str] = set()

    split_map = [
        ("train", "train"),
        ("valid", "validation"),
        ("test",  "test"),
    ]

    print("=== Roboflow veri seti ekleniyor ===")
    for src_split, dst_split in split_map:
        split_dir = ROBOFLOW_BASE / src_split
        csv_path  = split_dir / "_classes.csv"
        print(f"\n[{dst_split}] işleniyor...")
        copy_from_roboflow_csv(csv_path, split_dir, dst_split, stats, new_classes)
        print(f"  [{dst_split}] {stats[dst_split]:,} görüntü eklendi")

    # labels.txt güncelle
    labels_path = MERGED_BASE / "labels.txt"
    existing: set[str] = set()
    if labels_path.exists():
        existing = {l.strip() for l in labels_path.read_text("utf-8").splitlines() if l.strip()}

    added = new_classes - existing
    all_classes = sorted(existing | new_classes)

    with open(labels_path, "w", encoding="utf-8") as f:
        for c in all_classes:
            f.write(c + "\n")

    print("\n" + "=" * 50)
    print(f"Eklenen görüntü  — train     : {stats['train']:,}")
    print(f"                 — validation: {stats['validation']:,}")
    print(f"                 — test      : {stats['test']:,}")
    print(f"Toplam eklenen   : {sum(stats.values()):,}")
    print(f"Yeni sınıflar    : {sorted(added) if added else '(yok, hepsi mevcut)'}")
    print(f"Toplam sınıf     : {len(all_classes)}")
    print(f"labels.txt       : {labels_path.resolve()}")


if __name__ == "__main__":
    main()
