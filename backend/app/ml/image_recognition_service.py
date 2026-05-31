from __future__ import annotations

import random
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from ..settings import settings


@dataclass(frozen=True)
class DetectedIngredient:
    name: str
    confidence: float


_LABEL_TO_TR: dict[str, str] = {
    "tomato": "domates",
    "carrot": "havuç",
    "potato": "patates",
    "cucumber": "salatalık",
    "broccoli": "brokoli",
    "cauliflower": "karnabahar",
    "cabbage": "lahana",
    "capsicum": "biber",
    "radish": "turp",
    "brinjal": "patlıcan",
    "bean": "fasulye",
    "pumpkin": "bal kabağı",
    "bitter_gourd": "acı kabak",
    "bottle_gourd": "su kabağı",
    "papaya": "papaya",
}


def _to_ingredient_name(label: str) -> str:
    key = label.strip().lower()
    key = key.replace(" ", "_")
    return _LABEL_TO_TR.get(key, label.strip().lower().replace("_", " "))


class ImageRecognitionService:
    def detect(self, image_path: Path) -> list[DetectedIngredient]:
        mode = (settings.image_recognition_mode or "dummy").strip().lower()
        if mode == "keras":
            return _keras_detect(image_path)
        return _dummy_detect(image_path)


def _dummy_detect(image_path: Path) -> list[DetectedIngredient]:
    name = image_path.name.lower()
    candidates = ["domates", "soğan", "patates", "havuç", "yumurta", "tavuk", "balık", "pirinç"]
    hits = [c for c in candidates if c in name]
    if not hits:
        hits = random.sample(candidates, k=2)
    return [DetectedIngredient(name=h, confidence=round(random.uniform(0.72, 0.95), 2)) for h in hits[:5]]


@lru_cache(maxsize=1)
def _load_keras():
    try:
        import numpy as np  # type: ignore
        import tensorflow as tf  # type: ignore
        from PIL import Image  # type: ignore
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "Keras mode için tensorflow/numpy/pillow gerekli. "
            "Kurulum: pip install tensorflow numpy pillow"
        ) from e

    model_path = Path(settings.keras_model_path).resolve()
    labels_path = Path(settings.keras_labels_path).resolve()
    if not model_path.exists():
        raise RuntimeError(f"Model bulunamadı: {model_path}")
    if not labels_path.exists():
        raise RuntimeError(f"Labels bulunamadı: {labels_path}")

    model = tf.keras.models.load_model(str(model_path), compile=False)
    labels = [line.strip() for line in labels_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    return model, labels, np, Image, preprocess_input


def _keras_detect(image_path: Path) -> list[DetectedIngredient]:
    model, labels, np, Image, preprocess_input = _load_keras()
    img = Image.open(image_path).convert("RGB").resize((224, 224))
    arr = np.array(img, dtype=np.float32)
    arr = np.expand_dims(arr, axis=0)
    arr = preprocess_input(arr)
    preds = model.predict(arr, verbose=0)[0]

    topk = preds.argsort()[-5:][::-1]
    out: list[DetectedIngredient] = []
    for idx in topk:
        label = labels[int(idx)] if int(idx) < len(labels) else str(idx)
        out.append(DetectedIngredient(name=_to_ingredient_name(label), confidence=float(preds[int(idx)])))
    return out
