"""Admin dashboard routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import require_admin
from app.schemas.admin import DashboardStats
from app.services.admin_service import AdminService

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    service = AdminService(db)
    return await service.get_dashboard_stats()
