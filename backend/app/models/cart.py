"""Cart and CartItem models."""

from sqlalchemy import Column, Integer, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, UUIDMixin, TimestampMixin


class Cart(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "carts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan", lazy="selectin", order_by="CartItem.created_at")

    @property
    def total(self) -> float:
        """Calculate the total price of all items in the cart."""
        return sum(item.subtotal for item in self.items)

    def __repr__(self):
        return f"<Cart user={self.user_id} items={len(self.items)}>"


class CartItem(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "cart_items"

    cart_id = Column(UUID(as_uuid=True), ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product", lazy="selectin")

    @property
    def subtotal(self) -> float:
        return float(self.unit_price) * self.quantity

    def __repr__(self):
        return f"<CartItem product={self.product_id} qty={self.quantity}>"
