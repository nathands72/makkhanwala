"""Sample API tests for auth, products, and cart."""

import pytest
from httpx import AsyncClient


# ─── Auth Tests ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    response = await client.post("/api/auth/register", json={
        "email": "newuser@test.com",
        "password": "password123",
        "full_name": "New User",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    # Register first time
    await client.post("/api/auth/register", json={
        "email": "duplicate@test.com",
        "password": "password123",
        "full_name": "User One",
    })
    # Try registering with same email
    response = await client.post("/api/auth/register", json={
        "email": "duplicate@test.com",
        "password": "password456",
        "full_name": "User Two",
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post("/api/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "wrong",
    })
    assert response.status_code == 401


# ─── Product Tests ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_products(client: AsyncClient, sample_product):
    response = await client.get("/api/products")
    assert response.status_code == 200
    data = response.json()
    assert "products" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_product(client: AsyncClient, sample_product):
    response = await client.get(f"/api/products/{sample_product.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Butter"


@pytest.mark.asyncio
async def test_create_product_admin(client: AsyncClient, admin_token):
    response = await client.post(
        "/api/admin/products",
        json={
            "name": "Admin Butter",
            "price": 200,
            "weight": 500,
            "stock": 30,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Admin Butter"


@pytest.mark.asyncio
async def test_create_product_customer_forbidden(client: AsyncClient, customer_token):
    response = await client.post(
        "/api/admin/products",
        json={"name": "Hacker Butter", "price": 100, "weight": 500},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 403


# ─── Cart Tests ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_empty_cart(client: AsyncClient, customer_token):
    response = await client.get(
        "/api/cart",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["item_count"] == 0


@pytest.mark.asyncio
async def test_add_to_cart(client: AsyncClient, customer_token, sample_product):
    response = await client.post(
        "/api/cart/add",
        json={"product_id": str(sample_product.id), "quantity": 2},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["item_count"] == 2
    assert len(data["items"]) == 1


# ─── Health Check ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
