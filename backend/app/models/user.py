"""User model."""

from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship

from app.db.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin


class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), default="CUSTOMER", nullable=False)  # CUSTOMER | ADMIN
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    cart = relationship("Cart", back_populates="user", uselist=False, lazy="selectin")
    orders = relationship("Order", back_populates="user", lazy="selectin")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
