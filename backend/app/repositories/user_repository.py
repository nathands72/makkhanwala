"""User repository – data access layer for User model."""

import uuid
from typing import Union
from sqlalchemy import select


def _as_uuid(value: Union[uuid.UUID, str]) -> uuid.UUID:
    """Return a UUID object regardless of whether input is UUID or str."""
    return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: Union[uuid.UUID, str]) -> User | None:
        result = await self.db.execute(select(User).where(User.id == _as_uuid(user_id), User.is_deleted == False))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email, User.is_deleted == False))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> User:
        user = User(**kwargs)
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            setattr(user, key, value)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def count_all(self) -> int:
        result = await self.db.execute(select(User).where(User.is_deleted == False))
        return len(result.scalars().all())
