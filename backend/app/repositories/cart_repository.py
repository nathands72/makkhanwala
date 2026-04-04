"""Cart repository – data access layer for Cart and CartItem models."""

import uuid
from typing import Union
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import Cart, CartItem


def _as_uuid(value: Union[uuid.UUID, str]) -> uuid.UUID:
    """Return a UUID object regardless of whether input is UUID or str."""
    return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))


class CartRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_cart(self, user_id: Union[uuid.UUID, str]) -> Cart:
        uid = _as_uuid(user_id)
        result = await self.db.execute(
            select(Cart)
            .options(selectinload(Cart.items).selectinload(CartItem.product))
            .where(Cart.user_id == uid)
        )
        cart = result.scalar_one_or_none()
        if not cart:
            cart = Cart(user_id=uid)
            self.db.add(cart)
            await self.db.flush()
            await self.db.refresh(cart)
        return cart

    async def get_cart_item(self, cart_id: Union[uuid.UUID, str], product_id: Union[uuid.UUID, str]) -> CartItem | None:
        result = await self.db.execute(
            select(CartItem).where(
                CartItem.cart_id == _as_uuid(cart_id),
                CartItem.product_id == _as_uuid(product_id),
            )
        )
        return result.scalar_one_or_none()

    async def get_cart_item_by_id(self, item_id: Union[uuid.UUID, str]) -> CartItem | None:
        result = await self.db.execute(
            select(CartItem).where(CartItem.id == _as_uuid(item_id))
        )
        return result.scalar_one_or_none()

    async def add_item(self, cart_id: Union[uuid.UUID, str], product_id: Union[uuid.UUID, str], quantity: int, unit_price: float) -> CartItem:
        item = CartItem(
            cart_id=_as_uuid(cart_id),
            product_id=_as_uuid(product_id),
            quantity=quantity,
            unit_price=unit_price,
        )
        self.db.add(item)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def update_item_quantity(self, item: CartItem, quantity: int) -> CartItem:
        item.quantity = quantity
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def remove_item(self, item_id: Union[uuid.UUID, str]) -> None:
        await self.db.execute(
            delete(CartItem).where(CartItem.id == _as_uuid(item_id))
        )
        await self.db.flush()

    async def clear_cart(self, cart_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(CartItem).where(CartItem.cart_id == cart_id)
        )
        await self.db.flush()
