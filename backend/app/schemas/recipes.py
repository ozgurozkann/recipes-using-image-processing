from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RecipeCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class RecipeIngredientIn(BaseModel):
    ingredient_id: int
    quantity: float = 1
    unit: str = "adet"


class RecipeIngredientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ingredient_id: int
    name: str
    quantity: float
    unit: str


class RecipeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    instructions: str
    cooking_time: int
    serving_count: int
    difficulty: str
    category_id: int | None
    image_url: str
    created_by_user_id: int | None
    is_approved: bool
    favorite_count: int
    save_count: int
    is_favorited: bool = False
    is_saved: bool = False
    avg_rating: float | None = None
    review_count: int | None = None
    ingredients: list[RecipeIngredientOut] = []


class RecipeCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    instructions: str = ""
    cooking_time: int = 0
    serving_count: int = 1
    difficulty: str = "easy"
    category_id: int | None = None
    image_url: str = ""
    ingredients: list[RecipeIngredientIn] = Field(default_factory=list)


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=1000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user_name: str
    user_avatar: str | None = None
    rating: int
    comment: str
    created_at: datetime
    is_mine: bool = False


class RecipeUpdateIn(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    instructions: str | None = None
    cooking_time: int | None = None
    serving_count: int | None = None
    difficulty: str | None = None
    category_id: int | None = None
    image_url: str | None = None
    is_approved: bool | None = None
    ingredients: list[RecipeIngredientIn] | None = None
