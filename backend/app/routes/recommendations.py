from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
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
