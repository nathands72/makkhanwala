"""Cart request/response schemas."""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class CartAddRequest(BaseModel):
    product_id: UUID
    quantity: int = Field(1, ge=1)


class CartUpdateRequest(BaseModel):
    item_id: UUID
    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    product_image: str | None
    quantity: int
    unit_price: Decimal
    subtotal: float

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: UUID
    items: list[CartItemResponse]
    total: float
    item_count: int
