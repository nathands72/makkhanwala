"""Database seed script – creates admin user and sample products."""

import asyncio
import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.product import Product


SAMPLE_PRODUCTS = [
    {
        "name": "Classic Fresh Butter",
        "description": "Pure, creamy fresh butter made from farm-fresh cream. Perfect for everyday cooking and spreading on toast.",
        "price": Decimal("120.00"),
        "weight": 500,
        "image_url": "/images/classic-butter.jpg",
        "stock": 100,
    },
    {
        "name": "Salted Butter",
        "description": "Rich salted butter with the perfect hint of sea salt. Great for baking and cooking.",
        "price": Decimal("130.00"),
        "weight": 500,
        "image_url": "/images/salted-butter.jpg",
        "stock": 80,
    },
    {
        "name": "Organic Grass-Fed Butter",
        "description": "Premium organic butter from grass-fed cows. Deep golden color with rich flavor.",
        "price": Decimal("220.00"),
        "weight": 400,
        "image_url": "/images/organic-butter.jpg",
        "stock": 50,
    },
    {
        "name": "White Butter (Makhan)",
        "description": "Traditional homestyle white butter. Made from fresh curd using the traditional churning method.",
        "price": Decimal("180.00"),
        "weight": 500,
        "image_url": "/images/white-butter.jpg",
        "stock": 60,
    },
    {
        "name": "Peanut Butter Blend",
        "description": "Unique blend of fresh butter with roasted peanuts. A protein-rich spread for health-conscious customers.",
        "price": Decimal("200.00"),
        "weight": 350,
        "image_url": "/images/peanut-butter.jpg",
        "stock": 40,
    },
    {
        "name": "Garlic Herb Butter",
        "description": "Infused with fresh garlic and herbs. Perfect for garlic bread, steaks, and pasta.",
        "price": Decimal("160.00"),
        "weight": 250,
        "image_url": "/images/garlic-butter.jpg",
        "stock": 45,
    },
    {
        "name": "Honey Butter",
        "description": "Sweet honey blended with fresh butter. A delightful spread for pancakes and waffles.",
        "price": Decimal("175.00"),
        "weight": 300,
        "image_url": "/images/honey-butter.jpg",
        "stock": 55,
    },
    {
        "name": "Cultured Butter",
        "description": "European-style cultured butter with a tangy, complex flavor. For discerning food enthusiasts.",
        "price": Decimal("280.00"),
        "weight": 250,
        "image_url": "/images/cultured-butter.jpg",
        "stock": 30,
    },
]


async def seed():
    async with AsyncSessionLocal() as session:
        # Create admin user
        admin = User(
            id=uuid.uuid4(),
            email="admin@makkanwala.com",
            hashed_password=hash_password("admin123"),
            full_name="Makkanwala Admin",
            phone="+919876543210",
            role="ADMIN",
        )
        session.add(admin)

        # Create customer user
        customer = User(
            id=uuid.uuid4(),
            email="customer@example.com",
            hashed_password=hash_password("customer123"),
            full_name="Test Customer",
            phone="+919876543211",
            role="CUSTOMER",
        )
        session.add(customer)

        # Create products
        for product_data in SAMPLE_PRODUCTS:
            product = Product(id=uuid.uuid4(), **product_data)
            session.add(product)

        await session.commit()
        print("[OK] Database seeded successfully!")
        print(f"   Admin: admin@makkanwala.com / admin123")
        print(f"   Customer: customer@example.com / customer123")
        print(f"   Products: {len(SAMPLE_PRODUCTS)} items created")


if __name__ == "__main__":
    asyncio.run(seed())
