"""Pytest configuration and fixtures."""

import asyncio
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.core.security import hash_password
from app.models.user import User
from app.models.product import Product

# Use SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session
        await session.commit()


@pytest_asyncio.fixture
async def admin_token(client: AsyncClient, db_session: AsyncSession) -> str:
    """Create admin user and return auth token."""
    admin = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        hashed_password=hash_password("admin123"),
        full_name="Test Admin",
        role="ADMIN",
    )
    db_session.add(admin)
    await db_session.commit()

    response = await client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "admin123",
    })
    return response.json()["access_token"]


@pytest_asyncio.fixture
async def customer_token(client: AsyncClient, db_session: AsyncSession) -> str:
    """Create customer user and return auth token."""
    customer = User(
        id=uuid.uuid4(),
        email="customer@test.com",
        hashed_password=hash_password("customer123"),
        full_name="Test Customer",
        role="CUSTOMER",
    )
    db_session.add(customer)
    await db_session.commit()

    response = await client.post("/api/auth/login", json={
        "email": "customer@test.com",
        "password": "customer123",
    })
    return response.json()["access_token"]


@pytest_asyncio.fixture
async def sample_product(db_session: AsyncSession) -> Product:
    """Create a sample product for testing."""
    product = Product(
        id=uuid.uuid4(),
        name="Test Butter",
        description="Test butter product",
        price=150.00,
        weight=500,
        stock=50,
        is_active=True,
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    return product
