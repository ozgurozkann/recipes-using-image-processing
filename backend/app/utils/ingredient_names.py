from __future__ import annotations

import re
import unicodedata


_PAREN_RE = re.compile(r"\([^)]*\)")
_UNMATCHED_OPEN_PAREN_RE = re.compile(r"\([^)]*$")
_WS_RE = re.compile(r"\s+")
_QUANTITY_RE = (
    r"(?:\d+(?:[.,]\d+)?(?:\s*\+\s*\d+/\d+)?|"
    r"\d+/\d+(?:\s*-\s*\d+(?:/\d+)?)?|\d+\s*-\s*\d+|"
    r"\d+[a-zçğıöşü]+\d*|\d+[/']+|[¼½¾⅓⅔⅛⅜⅝⅞]|"
    r"bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|yarım|çeyrek)"
)
_UNITS_RE = r"(?:(?:su|çay)\s*bardağı|bardak|(?:yemek|tatlı|çay)\s*kaşığı|kaşık|parmak|paket|adet|diş|tutam|dal|demet|bağ|gram|gr|kg|ml|lt|litre)"
_LEADING_NOISY_MEASURE_RE = re.compile(
    rf"^(?:\+\s*)?[0-9a-zçğıöşü/+'.,\-\s]+{_UNITS_RE}\s+",
    re.IGNORECASE,
)
_LEADING_MEASURE_RE = re.compile(
    rf"^(?:\+\s*)?(?:{_QUANTITY_RE}\s*)?"
    rf"{_UNITS_RE}"
    r"(?:\s+(?:eksik|fazla|dolusu|silme|kadar|tepeleme))*\s+",
    re.IGNORECASE,
)
_LEADING_QUANTITY_ONLY_RE = re.compile(rf"^(?:\+\s*)?{_QUANTITY_RE}\s+", re.IGNORECASE)
_LEADING_FILLER_RE = re.compile(
    r"^(?:az\s+miktar|az\s+mikar|az(?!\s+(?:yağlı|tuzlu))|eksik|fazla|dolusu|silme|kadar|tepeleme)\s+",
    re.IGNORECASE,
)
_LEADING_SIZE_RE = re.compile(r"^(?:büyük|orta|küçük)\s+boy\s+", re.IGNORECASE)
_LEADING_GLUE_UNIT_RE = re.compile(
    r"^(?:adet|bardak|paket|demet|bağ|gram|gr|kg|ml|lt|litre|tutam|diş)(?=[a-zçğıöşü])",
    re.IGNORECASE,
)
_LEADING_OPTIONAL_RE = re.compile(r"^(?:isteğe göre|arzuya göre)\s+", re.IGNORECASE)
_PURPOSE_PREFIX_RE = re.compile(r"^.+\biçin[:;]?\s+", re.IGNORECASE)
_TRASH_RE = re.compile(r"^[\d\s+\-/'.]+$")
_NON_INGREDIENT_RE = re.compile(r"(?:çapında|kek kalıbı|kalıbı|moka pot|cam şişe)$", re.IGNORECASE)


def clean_ingredient_name(name: str) -> str:
    """Return only the ingredient name, without recipe-specific amount notes."""
    cleaned = unicodedata.normalize("NFC", str(name).strip().lower())
    cleaned = cleaned.replace("i\u0307", "i")
    cleaned = cleaned.lstrip(" +/\"'`")
    if "için:" in cleaned or "için;" in cleaned:
        return ""
    cleaned = _PAREN_RE.sub(" ", cleaned)
    if cleaned.startswith("(") and ")" not in cleaned:
        cleaned = cleaned[1:]
    else:
        cleaned = _UNMATCHED_OPEN_PAREN_RE.sub(" ", cleaned)
    cleaned = cleaned.replace("(", " ").replace(")", " ")
    cleaned = cleaned.strip(" ,.:;-")

    previous = None
    while previous != cleaned:
        previous = cleaned
        cleaned = _LEADING_OPTIONAL_RE.sub("", cleaned)
        cleaned = _PURPOSE_PREFIX_RE.sub("", cleaned)
        cleaned = _LEADING_NOISY_MEASURE_RE.sub("", cleaned)
        cleaned = _LEADING_MEASURE_RE.sub("", cleaned)
        cleaned = _LEADING_QUANTITY_ONLY_RE.sub("", cleaned)
        cleaned = _LEADING_FILLER_RE.sub("", cleaned)
        cleaned = _LEADING_SIZE_RE.sub("", cleaned)
        cleaned = _LEADING_GLUE_UNIT_RE.sub("", cleaned)
        cleaned = cleaned.strip(" ,.:;-")

    cleaned = _WS_RE.sub(" ", cleaned).strip()
    if _TRASH_RE.match(cleaned) or cleaned in {"bir gece", "gece"} or _NON_INGREDIENT_RE.search(cleaned):
        return ""
    return cleaned[:120]
