from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..ml.image_recognition_service import ImageRecognitionService
from ..models import Ingredient, User, UserUploadedImage
from ..schemas.recommendations import RecommendByIngredientsIn, RecommendItemOut
from ..services.recommendation_service import recommend_by_ingredient_ids


router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("/by-ingredients", response_model=dict[str, list[RecommendItemOut]])
def by_ingredients(payload: RecommendByIngredientsIn, db: Session = Depends(get_db)) -> dict[str, list[RecommendItemOut]]:
    ids = [x.ingredientId for x in payload.ingredients]
    results = recommend_by_ingredient_ids(db, ids, limit=30)
    return {
        "items": [
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
    }


@router.post("/by-image", response_model=dict[str, list[RecommendItemOut]])
async def by_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, list[RecommendItemOut]]:
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    path = uploads_dir / f"{user.id}_{file.filename}"
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    path.write_bytes(data)

    service = ImageRecognitionService()
    detected = service.detect(path)

    detected_names = [d.name for d in detected]
    matched_ingredients = db.execute(select(Ingredient).where(Ingredient.name.in_(detected_names))).scalars().all()
    ingredient_ids = [i.id for i in matched_ingredients]

    db.add(
        UserUploadedImage(
            user_id=user.id,
            image_url=str(path).replace("\\", "/"),
            detected_ingredients_json=json.dumps([d.__dict__ for d in detected], ensure_ascii=False),
        )
    )
    db.commit()

    results = recommend_by_ingredient_ids(db, ingredient_ids, limit=30)
    return {
        "items": [
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
    }

