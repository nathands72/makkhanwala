"""Product service – business logic for product management."""

import uuid
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
import math

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
PRODUCT_IMAGES_DIR = Path("static/products")


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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return ProductResponse.model_validate(product)

    async def create_product(self, data: ProductCreate) -> ProductResponse:
        product = await self.repo.create(**data.model_dump())
        return ProductResponse.model_validate(product)

    async def update_product(self, product_id: str, data: ProductUpdate) -> ProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        updated = await self.repo.update(product, **data.model_dump(exclude_unset=True))
        return ProductResponse.model_validate(updated)

    async def delete_product(self, product_id: str) -> None:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        await self.repo.soft_delete(product)

    async def upload_product_image(self, product_id: str, file: UploadFile) -> ProductResponse:
        """Save an uploaded image to disk and update the product's image_url."""
        # Validate product exists
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        # Validate content type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '{file.content_type}'. Allowed: jpeg, png, webp, gif.",
            )

        # Read & validate size
        contents = await file.read()
        if len(contents) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image file too large. Maximum size is 5 MB.",
            )

        # Build a unique filename  <product_id>.<ext>
        ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
        filename = f"{product_id}.{ext}"
        dest = PRODUCT_IMAGES_DIR / filename
        dest.write_bytes(contents)

        # Update DB record with relative URL
        image_url = f"/static/products/{filename}"
        updated = await self.repo.update(product, image_url=image_url)
        return ProductResponse.model_validate(updated)
