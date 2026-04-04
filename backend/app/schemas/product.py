"""Product request/response schemas."""

from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    price: Decimal = Field(..., gt=0)
    weight: int = Field(..., gt=0)
    image_url: str | None = None
    stock: int = Field(0, ge=0)
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(None, gt=0)
    weight: int | None = Field(None, gt=0)
    image_url: str | None = None
    stock: int | None = Field(None, ge=0)
    is_active: bool | None = None


class ProductResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    price: Decimal
    weight: int
    image_url: str | None
    stock: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    products: list[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
