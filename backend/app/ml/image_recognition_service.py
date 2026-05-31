from __future__ import annotations

import os
import random
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

# TensorFlow çıktılarını bastır (uyarı mesajları terminal'i kirletmesin)
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

from ..settings import settings


@dataclass(frozen=True)
class DetectedIngredient:
    name: str        # Türkçe malzeme adı
    confidence: float  # 0.0 – 1.0


# ── Model sınıf adı → Türkçe malzeme adı eşlemesi ──────────────────────────
# labels.txt'deki 15 sınıf: Bean, Bitter_Gourd, Bottle_Gourd, Brinjal,
# Broccoli, Cabbage, Capsicum, Carrot, Cauliflower, Cucumber, Papaya,
# Potato, Pumpkin, Radish, Tomato
_LABEL_TO_TR: dict[str, str] = {
    "bean":         "fasulye",
    "bitter_gourd": "acı kabak",
    "bottle_gourd": "su kabağı",
    "brinjal":      "patlıcan",
    "broccoli":     "brokoli",
    "cabbage":      "lahana",
    "capsicum":     "biber",
    "carrot":       "havuç",
    "cauliflower":  "karnabahar",
    "cucumber":     "salatalık",
    "papaya":       "papaya",
    "potato":       "patates",
    "pumpkin":      "bal kabağı",
    "radish":       "turp",
    "tomato":       "domates",
}

# Eşik değeri: bu güven oranının altındaki sınıfları görmezden gel
_CONFIDENCE_THRESHOLD = 0.08   # %8
# Maksimum döndürülecek sonuç sayısı
_TOP_K = 3


def _label_to_turkish(label: str) -> str:
    """Model etiketini Türkçe malzeme adına dönüştürür."""
    key = label.strip().lower().replace(" ", "_")
    return _LABEL_TO_TR.get(key, label.strip().lower().replace("_", " "))


class ImageRecognitionService:
    """
    Görüntüden malzeme tanıma servisi.

    settings.image_recognition_mode:
      - "keras"  → vegetable_model.keras modeli ile gerçek tahmin
      - "dummy"  → dosya adına / rastgele dayalı sahte sonuç (geliştirme)
    """

    def detect(self, image_path: Path) -> list[DetectedIngredient]:
        mode = (settings.image_recognition_mode or "dummy").strip().lower()
        if mode == "keras":
            return _keras_detect(image_path)
        return _dummy_detect(image_path)


# ── Keras (gerçek model) ─────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _load_keras_model():
    """
    Modeli yalnızca bir kez yükler; sonraki çağrılarda cache'den döner.
    Yükleme hatası olursa anlamlı mesajla RuntimeError fırlatır.
    """
    try:
        import numpy as np
        import tensorflow as tf
        from PIL import Image as PILImage
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

        # Keras'ın ek INFO loglarını kapat
        tf.get_logger().setLevel("ERROR")
    except ImportError as e:
        raise RuntimeError(
            "Keras modu için tensorflow ve pillow gerekli.\n"
            "Kurulum: pip install tensorflow-cpu pillow"
        ) from e

    model_path  = Path(settings.keras_model_path).resolve()
    labels_path = Path(settings.keras_labels_path).resolve()

    if not model_path.exists():
        raise RuntimeError(
            f"Model dosyası bulunamadı: {model_path}\n"
            f"KERAS_MODEL_PATH değerini .env içinde düzeltin."
        )
    if not labels_path.exists():
        raise RuntimeError(
            f"Etiket dosyası bulunamadı: {labels_path}\n"
            f"KERAS_LABELS_PATH değerini .env içinde düzeltin."
        )

    model  = tf.keras.models.load_model(str(model_path), compile=False)
    labels = [l.strip() for l in labels_path.read_text("utf-8").splitlines() if l.strip()]

    return model, labels, np, PILImage, preprocess_input


def _keras_detect(image_path: Path) -> list[DetectedIngredient]:
    """MobileNetV2 tabanlı gerçek model ile malzeme tespiti."""
    model, labels, np, PILImage, preprocess_input = _load_keras_model()

    # Görüntüyü hazırla (modelin beklediği format: 224×224, MobileNetV2 ön işlem)
    img  = PILImage.open(image_path).convert("RGB").resize((224, 224))
    arr  = np.expand_dims(np.array(img, dtype=np.float32), axis=0)
    arr  = preprocess_input(arr)

    preds: list[float] = model.predict(arr, verbose=0)[0].tolist()

    # Eşik üzerindeki sonuçları güven değerine göre sırala, en iyi _TOP_K'yı al
    results: list[DetectedIngredient] = []
    ranked = sorted(enumerate(preds), key=lambda x: x[1], reverse=True)

    for idx, conf in ranked[:_TOP_K]:
        if conf < _CONFIDENCE_THRESHOLD:
            break
        label = labels[idx] if idx < len(labels) else str(idx)
        results.append(DetectedIngredient(
            name=_label_to_turkish(label),
            confidence=round(conf, 4),
        ))

    # En az 1 sonuç garantile (eşiğin altında bile olsa en iyi tahmini döndür)
    if not results and ranked:
        idx, conf = ranked[0]
        label = labels[idx] if idx < len(labels) else str(idx)
        results.append(DetectedIngredient(
            name=_label_to_turkish(label),
            confidence=round(conf, 4),
        ))

    return results


# ── Dummy (geliştirme modu) ──────────────────────────────────────────────────

_DUMMY_CANDIDATES = [
    "domates", "soğan", "patates", "havuç", "yumurta",
    "tavuk", "brokoli", "patlıcan", "fasulye", "kabak",
]

def _dummy_detect(image_path: Path) -> list[DetectedIngredient]:
    """
    Dosya adında bilinen malzeme adı geçiyorsa onu döndürür,
    aksi hâlde rastgele 1-2 malzeme seçer.
    """
    name = image_path.name.lower()
    hits = [c for c in _DUMMY_CANDIDATES if c in name]
    if not hits:
        hits = random.sample(_DUMMY_CANDIDATES, k=random.randint(1, 2))
    return [
        DetectedIngredient(name=h, confidence=round(random.uniform(0.72, 0.95), 2))
        for h in hits[:3]
    ]
