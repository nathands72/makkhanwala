"""Product routes."""

from typing import Optional
from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import require_admin
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.schemas.auth import MessageResponse
from app.services.product_service import ProductService

router = APIRouter(tags=["Products"])


# ─── Public endpoints ─────────────────────────────────────────

@router.get("/api/products", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    return await service.list_products(page=page, page_size=page_size, search=search, min_price=min_price, max_price=max_price)


@router.get("/api/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    service = ProductService(db)
    return await service.get_product(product_id)


# ─── Admin endpoints ──────────────────────────────────────────

@router.post("/api/admin/products", response_model=ProductResponse)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    service = ProductService(db)
    return await service.create_product(data)


@router.put("/api/admin/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    service = ProductService(db)
    return await service.update_product(product_id, data)


@router.delete("/api/admin/products/{product_id}", response_model=MessageResponse)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    service = ProductService(db)
    await service.delete_product(product_id)
    return MessageResponse(message="Product deleted successfully")


@router.post("/api/admin/products/{product_id}/image", response_model=ProductResponse)
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Upload or replace a product's image (multipart/form-data, field name: 'file')."""
    service = ProductService(db)
    return await service.upload_product_image(product_id, file)
