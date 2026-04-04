"""Order routes."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_user, require_admin
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse, OrderStatusUpdate
from app.services.order_service import OrderService

router = APIRouter(tags=["Orders"])


# ─── Customer endpoints ───────────────────────────────────────

@router.post("/api/orders", response_model=OrderResponse)
async def create_order(
    data: OrderCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.create_order(str(current_user.id), data)


@router.get("/api/orders", response_model=OrderListResponse)
async def list_my_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.list_user_orders(str(current_user.id), page, page_size)


@router.get("/api/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.get_order(order_id, str(current_user.id))


# ─── Admin endpoints ──────────────────────────────────────────

@router.get("/api/admin/orders", response_model=OrderListResponse)
async def list_all_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    service = OrderService(db)
    return await service.list_all_orders(page, page_size, status)


@router.put("/api/admin/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    service = OrderService(db)
    return await service.update_order_status(order_id, data)
