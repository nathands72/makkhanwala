"""Order and OrderItem models."""

from sqlalchemy import Column, String, Integer, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, UUIDMixin, TimestampMixin


class Order(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "orders"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(String(20), default="PENDING", nullable=False)  # PENDING | SUCCESS | FAILED
    order_status = Column(String(20), default="PLACED", nullable=False)    # PLACED | PROCESSING | SHIPPED | DELIVERED
    delivery_address = Column(Text, nullable=False)
    payment_id = Column(String(255), nullable=True)        # Razorpay/Stripe payment ID
    payment_provider = Column(String(50), nullable=True)   # razorpay | stripe

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"<Order {self.id} status={self.order_status} payment={self.payment_status}>"


class OrderItem(Base, UUIDMixin):
    __tablename__ = "order_items"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String(255), nullable=False)  # Snapshot of product name at order time
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", lazy="selectin")

    @property
    def subtotal(self) -> float:
        return float(self.unit_price) * self.quantity

    def __repr__(self):
        return f"<OrderItem {self.product_name} x{self.quantity}>"
