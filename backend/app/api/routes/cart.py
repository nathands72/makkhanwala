"""Cart routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.cart import CartResponse, CartAddRequest, CartUpdateRequest
from app.services.cart_service import CartService

router = APIRouter(prefix="/api/cart", tags=["Cart"])


@router.get("", response_model=CartResponse)
async def get_cart(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CartService(db)
    return await service.get_cart(str(current_user.id))


@router.post("/add", response_model=CartResponse)
async def add_to_cart(
    data: CartAddRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CartService(db)
    return await service.add_to_cart(str(current_user.id), data)


@router.put("/update", response_model=CartResponse)
async def update_cart_item(
    data: CartUpdateRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CartService(db)
    return await service.update_cart_item(str(current_user.id), data)


@router.delete("/remove/{item_id}", response_model=CartResponse)
async def remove_from_cart(
    item_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CartService(db)
    return await service.remove_from_cart(str(current_user.id), item_id)
