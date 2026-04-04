"""Product service – business logic for product management."""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
import math


class ProductService:
    def __init__(self, db: AsyncSession):
        self.repo = ProductRepository(db)

    async def list_products(
        self,
        page: int = 1,
        page_size: int = 12,
        search: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        active_only: bool = True,
    ) -> ProductListResponse:
        products, total = await self.repo.list_products(
            page=page, page_size=page_size, search=search,
            min_price=min_price, max_price=max_price, active_only=active_only,
        )
        return ProductListResponse(
            products=[ProductResponse.model_validate(p) for p in products],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        )

    async def get_product(self, product_id: str) -> ProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return ProductResponse.model_validate(product)

    async def create_product(self, data: ProductCreate) -> ProductResponse:
        product = await self.repo.create(**data.model_dump())
        return ProductResponse.model_validate(product)

    async def update_product(self, product_id: str, data: ProductUpdate) -> ProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        updated = await self.repo.update(product, **data.model_dump(exclude_unset=True))
        return ProductResponse.model_validate(updated)

    async def delete_product(self, product_id: str) -> None:
        product = await self.repo.get_by_id(product_id)
        if not product:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        await self.repo.soft_delete(product)
