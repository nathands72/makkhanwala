"""Cart service – business logic for shopping cart."""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.cart_repository import CartRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.cart import CartResponse, CartItemResponse, CartAddRequest, CartUpdateRequest


class CartService:
    def __init__(self, db: AsyncSession):
        self.cart_repo = CartRepository(db)
        self.product_repo = ProductRepository(db)

    async def get_cart(self, user_id: str) -> CartResponse:
        cart = await self.cart_repo.get_or_create_cart(user_id)
        items = []
        for item in cart.items:
            product = item.product
            items.append(CartItemResponse(
                id=str(item.id),
                product_id=str(item.product_id),
                product_name=product.name if product else "Deleted Product",
                product_image=product.image_url if product else None,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item.subtotal,
            ))
        return CartResponse(
            id=str(cart.id),
            items=items,
            total=cart.total,
            item_count=sum(item.quantity for item in cart.items),
        )

    async def add_to_cart(self, user_id: str, data: CartAddRequest) -> CartResponse:
        product = await self.product_repo.get_by_id(data.product_id)
        if not product or not product.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or inactive")
        if product.stock < data.quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")

        cart = await self.cart_repo.get_or_create_cart(user_id)

        # Check if product already in cart
        existing_item = await self.cart_repo.get_cart_item(cart.id, data.product_id)
        if existing_item:
            new_qty = existing_item.quantity + data.quantity
            if product.stock < new_qty:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")
            await self.cart_repo.update_item_quantity(existing_item, new_qty)
        else:
            await self.cart_repo.add_item(cart.id, data.product_id, data.quantity, float(product.price))

        return await self.get_cart(user_id)

    async def update_cart_item(self, user_id: str, data: CartUpdateRequest) -> CartResponse:
        item = await self.cart_repo.get_cart_item_by_id(data.item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

        product = await self.product_repo.get_by_id(str(item.product_id))
        if product and product.stock < data.quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")

        await self.cart_repo.update_item_quantity(item, data.quantity)
        return await self.get_cart(user_id)

    async def remove_from_cart(self, user_id: str, item_id: str) -> CartResponse:
        item = await self.cart_repo.get_cart_item_by_id(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
        await self.cart_repo.remove_item(item_id)
        return await self.get_cart(user_id)
