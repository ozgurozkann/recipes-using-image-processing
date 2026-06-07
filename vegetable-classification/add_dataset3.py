"""
görüntü işleme 3 veri setini merged_dataset'e ekler.

CSV formatı: filename, width, height, class, xmin, ymin, xmax, ymax
Strateji   : Her görüntüde en fazla geçen sınıf (dominant class) kullanılır.
             Beraberlik durumunda bounding box toplam alanı büyük olan sınıf seçilir.
"""

import csv
import re
import shutil
from collections import defaultdict
from pathlib import Path

DATASET3_BASE = Path(r"C:\Users\emrea\Desktop\görüntü işleme 3")
MERGED_BASE   = Path("dataset/merged_dataset")

# dataset3 sınıf adı → merged_dataset canonical sınıf adı
CLASS_MAP = {
    "beef":          "Beef",
    "bell_pepper":   "Capsicum",
    "cabbage":       "Cabbage",
    "carrot":        "Carrot",
    "cauliflower":   "Cauliflower",
    "chicken":       "Chicken",
    "cucumber":      "Cucumber",
    "egg":           "Egg",
    "fish":          "Fish",
    "garlic":        "Garlic",
    "ginger":        "Ginger",
    "kumquat":       "Kumquat",
    "lemon":         "Lemon",
    "onion":         "Onion",
    "pork":          "Pork",
    "potato":        "Potato",
    "shrimp":        "Shrimp",
    "small_pepper":  "Capsicum",
    "tofu":          "Tofu",
    "tomato":        "Tomato",
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


def dominant_class(rows: list[dict]) -> str:
    """Görüntüdeki en baskın sınıfı seç (count, sonra alan)."""
    count: dict[str, int] = defaultdict(int)
    area:  dict[str, int] = defaultdict(int)
    for r in rows:
        cls = r["class"].strip()
        count[cls] += 1
        try:
            a = (int(r["xmax"]) - int(r["xmin"])) * (int(r["ymax"]) - int(r["ymin"]))
            area[cls] += max(0, a)
        except (ValueError, KeyError):
            pass
    max_count = max(count.values())
    candidates = [c for c, n in count.items() if n == max_count]
    if len(candidates) == 1:
        return candidates[0]
    return max(candidates, key=lambda c: area[c])


def process_split(src_split: str, dst_split: str, stats: dict, new_classes: set) -> None:
    split_dir = DATASET3_BASE / src_split
    csv_path  = split_dir / "_annotations.csv"

    if not csv_path.exists():
        print(f"  [UYARI] CSV bulunamadı: {csv_path}")
        return

    # filename → rows
    by_file: dict[str, list[dict]] = defaultdict(list)
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            by_file[row["filename"].strip()].append(row)

    skipped = 0
    for filename, rows in by_file.items():
        src = split_dir / filename
        if not src.exists():
            skipped += 1
            continue

        raw_cls = dominant_class(rows)
        cls = CLASS_MAP.get(raw_cls, raw_cls.capitalize())

        dst_dir_path = MERGED_BASE / dst_split / cls
        dst_dir_path.mkdir(parents=True, exist_ok=True)

        new_name = safe_filename("ds3", filename)
        target   = _unique_target(dst_dir_path, new_name)
        shutil.copy2(src, target)

        stats[dst_split] += 1
        new_classes.add(cls)

    if skipped:
        print(f"  [{dst_split}] {skipped} görüntü atlandı (dosya bulunamadı)")


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

    print("=== Dataset 3 ekleniyor (bounding box -> classification) ===")
    for src_split, dst_split in split_map:
        print(f"\n[{dst_split}] işleniyor...")
        process_split(src_split, dst_split, stats, new_classes)
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
