"""Order service – business logic for order management."""

import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.order_repository import OrderRepository
from app.repositories.cart_repository import CartRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.order import OrderCreate, OrderResponse, OrderItemResponse, OrderListResponse, OrderStatusUpdate
import math


class OrderService:
    def __init__(self, db: AsyncSession):
        self.order_repo = OrderRepository(db)
        self.cart_repo = CartRepository(db)
        self.product_repo = ProductRepository(db)

    async def create_order(self, user_id: str, data: OrderCreate) -> OrderResponse:
        """Create an order from the user's cart."""
        cart = await self.cart_repo.get_or_create_cart(user_id)
        if not cart.items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

        # Validate stock and build order items
        order_items = []
        total = 0
        for item in cart.items:
            product = await self.product_repo.get_by_id(str(item.product_id))
            if not product or not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{item.product.name if item.product else 'unknown'}' is no longer available",
                )
            if product.stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.name}'",
                )
            subtotal = float(product.price) * item.quantity
            total += subtotal
            order_items.append({
                "product_id": product.id,
                "product_name": product.name,
                "quantity": item.quantity,
                "unit_price": float(product.price),
            })

            # Deduct stock
            await self.product_repo.update(product, stock=product.stock - item.quantity)

        # Create order
        order = await self.order_repo.create(
            user_id=uuid.UUID(user_id),
            total_amount=total,
            delivery_address=data.delivery_address,
            payment_provider=data.payment_provider,
            items=order_items,
        )

        # Clear cart
        await self.cart_repo.clear_cart(cart.id)

        return self._to_response(order)

    async def get_order(self, order_id: str, user_id: str = None) -> OrderResponse:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if user_id and str(order.user_id) != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return self._to_response(order)

    async def list_user_orders(self, user_id: str, page: int = 1, page_size: int = 10) -> OrderListResponse:
        orders, total = await self.order_repo.list_by_user(user_id, page, page_size)
        return OrderListResponse(
            orders=[self._to_response(o) for o in orders],
            total=total, page=page, page_size=page_size,
        )

    async def list_all_orders(self, page: int = 1, page_size: int = 10, status_filter: str = None) -> OrderListResponse:
        orders, total = await self.order_repo.list_all(page, page_size, status_filter)
        return OrderListResponse(
            orders=[self._to_response(o) for o in orders],
            total=total, page=page, page_size=page_size,
        )

    async def update_order_status(self, order_id: str, data: OrderStatusUpdate) -> OrderResponse:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        updated = await self.order_repo.update_status(order, order_status=data.order_status)
        return self._to_response(updated)

    def _to_response(self, order) -> OrderResponse:
        return OrderResponse(
            id=str(order.id),
            user_id=str(order.user_id) if order.user_id else None,
            total_amount=order.total_amount,
            payment_status=order.payment_status,
            order_status=order.order_status,
            delivery_address=order.delivery_address,
            payment_id=order.payment_id,
            payment_provider=order.payment_provider,
            items=[
                OrderItemResponse(
                    id=str(item.id),
                    product_id=str(item.product_id) if item.product_id else None,
                    product_name=item.product_name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    subtotal=item.subtotal,
                ) for item in order.items
            ],
            created_at=order.created_at,
        )
