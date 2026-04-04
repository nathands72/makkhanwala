"""Admin service – analytics and dashboard business logic."""

from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.user_repository import UserRepository
from app.schemas.admin import DashboardStats


class AdminService:
    def __init__(self, db: AsyncSession):
        self.order_repo = OrderRepository(db)
        self.product_repo = ProductRepository(db)
        self.user_repo = UserRepository(db)

    async def get_dashboard_stats(self) -> DashboardStats:
        """Get aggregated dashboard analytics."""
        total_users = await self.user_repo.count_all()
        total_orders = await self.order_repo.count_all()
        total_revenue = await self.order_repo.total_revenue()
        orders_by_status = await self.order_repo.count_by_status()
        low_stock = await self.product_repo.get_low_stock(threshold=10)
        recent = await self.order_repo.recent_orders(limit=5)

        return DashboardStats(
            total_users=total_users,
            total_orders=total_orders,
            total_revenue=Decimal(str(total_revenue)),
            orders_by_status=orders_by_status,
            low_stock_products=[
                {"id": str(p.id), "name": p.name, "stock": p.stock, "price": str(p.price)}
                for p in low_stock
            ],
            recent_orders=[
                {
                    "id": str(o.id),
                    "total_amount": str(o.total_amount),
                    "order_status": o.order_status,
                    "payment_status": o.payment_status,
                    "created_at": o.created_at.isoformat(),
                }
                for o in recent
            ],
        )
