"""Order request/response schemas."""

from decimal import Decimal
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class OrderCreate(BaseModel):
    delivery_address: str = Field(..., min_length=10, max_length=500)
    payment_provider: str = Field("razorpay", pattern="^(razorpay|stripe)$")


class OrderStatusUpdate(BaseModel):
    order_status: str = Field(..., pattern="^(PLACED|PROCESSING|SHIPPED|DELIVERED)$")


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: UUID | None
    product_name: str
    quantity: int
    unit_price: Decimal
    subtotal: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: UUID
    user_id: UUID | None
    total_amount: Decimal
    payment_status: str
    order_status: str
    delivery_address: str
    payment_id: str | None
    payment_provider: str | None
    items: list[OrderItemResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    orders: list[OrderResponse]
    total: int
    page: int
    page_size: int
