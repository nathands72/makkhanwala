"""Order repository – data access layer for Order and OrderItem models."""

import uuid
from typing import Optional, Union


def _as_uuid(value: Union[uuid.UUID, str]) -> uuid.UUID:
    """Return a UUID object regardless of whether input is UUID or str."""
    return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem


class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> Order:
        items_data = kwargs.pop("items", [])
        order = Order(**kwargs)
        self.db.add(order)
        await self.db.flush()

        for item_data in items_data:
            item = OrderItem(order_id=order.id, **item_data)
            self.db.add(item)

        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def get_by_id(self, order_id: Union[uuid.UUID, str]) -> Order | None:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.id == _as_uuid(order_id))
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: Union[uuid.UUID, str], page: int = 1, page_size: int = 10) -> tuple[list[Order], int]:
        query = select(Order).where(Order.user_id == _as_uuid(user_id))

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar()

        query = query.options(selectinload(Order.items))
        query = query.order_by(Order.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        orders = result.scalars().unique().all()

        return list(orders), total

    async def list_all(self, page: int = 1, page_size: int = 10, status: Optional[str] = None) -> tuple[list[Order], int]:
        query = select(Order)
        if status:
            query = query.where(Order.order_status == status)

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar()

        query = query.options(selectinload(Order.items))
        query = query.order_by(Order.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        orders = result.scalars().unique().all()

        return list(orders), total

    async def update_status(self, order: Order, **kwargs) -> Order:
        for key, value in kwargs.items():
            setattr(order, key, value)
        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def count_all(self) -> int:
        result = await self.db.execute(select(func.count()).select_from(Order))
        return result.scalar()

    async def total_revenue(self) -> float:
        result = await self.db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(Order.payment_status == "SUCCESS")
        )
        return float(result.scalar())

    async def count_by_status(self) -> dict[str, int]:
        result = await self.db.execute(
            select(Order.order_status, func.count()).group_by(Order.order_status)
        )
        return {row[0]: row[1] for row in result.all()}

    async def recent_orders(self, limit: int = 5) -> list[Order]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().unique().all())
