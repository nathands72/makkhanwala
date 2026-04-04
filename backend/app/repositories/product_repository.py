"""Product repository – data access layer for Product model."""

import uuid
from typing import Optional, Union
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product


class ProductRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, product_id: Union[uuid.UUID, str]) -> Product | None:
        pid = product_id if isinstance(product_id, uuid.UUID) else uuid.UUID(str(product_id))
        result = await self.db.execute(
            select(Product).where(Product.id == pid, Product.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def list_products(
        self,
        page: int = 1,
        page_size: int = 12,
        search: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        active_only: bool = True,
    ) -> tuple[list[Product], int]:
        query = select(Product).where(Product.is_deleted == False)

        if active_only:
            query = query.where(Product.is_active == True)
        if search:
            query = query.where(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.description.ilike(f"%{search}%"),
                )
            )
        if min_price is not None:
            query = query.where(Product.price >= min_price)
        if max_price is not None:
            query = query.where(Product.price <= max_price)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Paginate
        query = query.order_by(Product.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        products = result.scalars().all()

        return list(products), total

    async def create(self, **kwargs) -> Product:
        product = Product(**kwargs)
        self.db.add(product)
        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def update(self, product: Product, **kwargs) -> Product:
        for key, value in kwargs.items():
            if value is not None:
                setattr(product, key, value)
        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def soft_delete(self, product: Product) -> None:
        product.is_deleted = True
        product.is_active = False
        await self.db.flush()

    async def get_low_stock(self, threshold: int = 10) -> list[Product]:
        result = await self.db.execute(
            select(Product).where(
                Product.is_deleted == False,
                Product.is_active == True,
                Product.stock <= threshold,
            )
        )
        return list(result.scalars().all())
