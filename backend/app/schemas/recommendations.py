from __future__ import annotations

from pydantic import BaseModel, Field


class InputIngredient(BaseModel):
    ingredientId: int
    quantity: float = 1
    unit: str = "adet"


class RecommendByIngredientsIn(BaseModel):
    ingredients: list[InputIngredient] = Field(default_factory=list)


class RecommendItemOut(BaseModel):
    recipeId: int
    title: str
    matchScore: int
    matchedIngredients: list[str]
    missingIngredients: list[str]
    favoriteCount: int
    saveCount: int

