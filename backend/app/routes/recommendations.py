from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, get_optional_user
from ..ml.image_recognition_service import DetectedIngredient, ImageRecognitionService
from ..models import Ingredient, User, UserUploadedImage
from ..schemas.recommendations import (
    DetectedIngredientOut,
    ImageRecommendOut,
    RecommendByIngredientsIn,
    RecommendItemOut,
)
from ..services.recommendation_service import recommend_by_ingredient_ids


router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def _recommend_items(results) -> list[RecommendItemOut]:
    return [
        RecommendItemOut(
            recipeId=r.recipe_id,
            title=r.title,
            matchScore=r.match_score,
            matchedIngredients=r.matched_ingredients,
            missingIngredients=r.missing_ingredients,
            favoriteCount=r.favorite_count,
            saveCount=r.save_count,
        )
        for r in results
    ]


def _merge_detected(detected_by_file: list[tuple[str, list[DetectedIngredient]]]) -> list[DetectedIngredientOut]:
    merged: dict[str, DetectedIngredientOut] = {}
    for filename, detected in detected_by_file:
        for item in detected:
            key = item.name.strip().casefold()
            if not key:
                continue
            current = merged.get(key)
            if current is None or item.confidence > current.confidence:
                merged[key] = DetectedIngredientOut(name=item.name, confidence=item.confidence, source=filename)
    return sorted(merged.values(), key=lambda x: (-x.confidence, x.name))


async def _save_and_detect(
    files: list[UploadFile],
    user: User,
    db: Session,
    service: ImageRecognitionService,
) -> list[DetectedIngredientOut]:
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    detected_by_file: list[tuple[str, list[DetectedIngredient]]] = []

    for index, file in enumerate(files):
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail=f"Empty file: {file.filename}")

        filename = Path(file.filename or f"image-{index + 1}").name
        path = uploads_dir / f"{user.id}_{int(time.time() * 1000)}_{index}_{filename}"
        path.write_bytes(data)

        detected = await asyncio.to_thread(service.detect, path)
        detected_by_file.append((filename, detected))
        db.add(
            UserUploadedImage(
                user_id=user.id,
                image_url=str(path).replace("\\", "/"),
                detected_ingredients_json=json.dumps(
                    [dict(d.__dict__, source=filename) for d in detected],
                    ensure_ascii=False,
                ),
            )
        )

    db.commit()
    return _merge_detected(detected_by_file)


@router.post("/by-ingredients", response_model=dict[str, list[RecommendItemOut]])
def by_ingredients(payload: RecommendByIngredientsIn, db: Session = Depends(get_db)) -> dict[str, list[RecommendItemOut]]:
    ids = [x.ingredientId for x in payload.ingredients]
    results = recommend_by_ingredient_ids(db, ids, limit=30)
    return {"items": _recommend_items(results)}


@router.post("/by-image", response_model=ImageRecommendOut)
async def by_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ImageRecommendOut:
    service = ImageRecognitionService()
    detected = await _save_and_detect([file], user, db, service)

    detected_names = [d.name for d in detected]
    matched_ingredients = db.execute(select(Ingredient).where(Ingredient.name.in_(detected_names))).scalars().all()
    ingredient_ids = [i.id for i in matched_ingredients]

    results = recommend_by_ingredient_ids(db, ingredient_ids, limit=30)
    return ImageRecommendOut(items=_recommend_items(results), detectedIngredients=detected)


@router.post("/by-images", response_model=ImageRecommendOut)
async def by_images(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ImageRecommendOut:
    image_files = [file for file in files if file.content_type and file.content_type.startswith("image/")]
    if not image_files:
        raise HTTPException(status_code=400, detail="At least one image file is required")

    service = ImageRecognitionService()
    detected = await _save_and_detect(image_files, user, db, service)
    detected_names = [d.name for d in detected]
    matched_ingredients = db.execute(select(Ingredient).where(Ingredient.name.in_(detected_names))).scalars().all()
    ingredient_ids = [i.id for i in matched_ingredients]

    results = recommend_by_ingredient_ids(db, ingredient_ids, limit=30, require_all_inputs=True)
    return ImageRecommendOut(items=_recommend_items(results), detectedIngredients=detected)


@router.post("/combined", response_model=ImageRecommendOut)
async def combined(
    files: list[UploadFile] = File(default=[]),
    ingredient_ids: str = Form(default="[]"),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> ImageRecommendOut:
    image_files = [f for f in files if f.content_type and f.content_type.startswith("image/")]

    try:
        manual_ids: list[int] = json.loads(ingredient_ids)
    except (json.JSONDecodeError, ValueError):
        manual_ids = []

    all_ids: list[int] = list(manual_ids)
    detected: list[DetectedIngredientOut] = []

    if image_files:
        if user is None:
            raise HTTPException(status_code=401, detail="Fotoğraf yüklemek için giriş yapmanız gerekiyor")
        service = ImageRecognitionService()
        detected = await _save_and_detect(image_files, user, db, service)
        detected_names = [d.name for d in detected]
        matched = db.execute(select(Ingredient).where(Ingredient.name.in_(detected_names))).scalars().all()
        all_ids.extend(i.id for i in matched)

    all_ids = list(set(all_ids))

    if not all_ids:
        return ImageRecommendOut(items=[], detectedIngredients=detected)

    results = recommend_by_ingredient_ids(db, all_ids, limit=30)
    return ImageRecommendOut(items=_recommend_items(results), detectedIngredients=detected)
