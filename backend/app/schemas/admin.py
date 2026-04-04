"""Admin dashboard schemas."""

from decimal import Decimal
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_users: int
    total_orders: int
    total_revenue: Decimal
    orders_by_status: dict[str, int]
    low_stock_products: list[dict]
    recent_orders: list[dict]
