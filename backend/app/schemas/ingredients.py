from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class IngredientCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class IngredientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category_id: int | None
    unit_type: str


class IngredientCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category_id: int | None = None
    unit_type: str = Field(default="adet", max_length=32)


class IngredientUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    category_id: int | None = None
    unit_type: str | None = Field(default=None, max_length=32)
