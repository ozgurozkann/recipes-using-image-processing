from __future__ import annotations

import time
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..deps import get_current_user
from ..models import User

RECIPE_IMGS_DIR = Path("uploads/recipes")

router = APIRouter(prefix="/images", tags=["images"])


@router.post("/recipe", response_model=dict[str, str])
async def upload_recipe_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
) -> dict[str, str]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Yalnızca görsel dosyası yüklenebilir")
    data = await file.read()
    RECIPE_IMGS_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "photo.jpg").suffix or ".jpg"
    filename = f"recipe_{user.id}_{int(time.time() * 1000)}{ext}"
    (RECIPE_IMGS_DIR / filename).write_bytes(data)
    return {"url": f"/uploads/recipes/{filename}"}
