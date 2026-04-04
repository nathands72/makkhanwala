"""Authentication service – business logic for user auth."""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_refresh_token
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse


class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def register(self, data: RegisterRequest) -> dict:
        """Register a new customer."""
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        user = await self.repo.create(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role="CUSTOMER",
        )

        tokens = self._generate_tokens(str(user.id), user.role)
        return {
            "user": user,
            "tokens": tokens,
        }

    async def login(self, data: LoginRequest) -> dict:
        """Authenticate and return tokens."""
        user = await self.repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

        tokens = self._generate_tokens(str(user.id), user.role)
        return {
            "user": user,
            "tokens": tokens,
        }

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """Issue new tokens from a valid refresh token."""
        payload = decode_refresh_token(refresh_token)
        user_id = payload.get("sub")
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        return self._generate_tokens(str(user.id), user.role)

    async def forgot_password(self, email: str) -> str:
        """Simulate sending a password reset email."""
        user = await self.repo.get_by_email(email)
        if not user:
            # Don't reveal whether the email exists
            return "If the email exists, a reset link has been sent."

        # In production, send an actual email with a reset token
        # For now, simulate it
        return "If the email exists, a reset link has been sent."

    def _generate_tokens(self, user_id: str, role: str) -> TokenResponse:
        access_token = create_access_token({"sub": user_id, "role": role})
        refresh_token = create_refresh_token({"sub": user_id, "role": role})
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
