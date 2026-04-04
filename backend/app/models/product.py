"""Product model."""

from sqlalchemy import Column, String, Integer, Boolean, Numeric, Text

from app.db.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin


class Product(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "products"

    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    weight = Column(Integer, nullable=False)  # in grams
    image_url = Column(String(500), nullable=True)
    stock = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<Product {self.name} ₹{self.price}>"
