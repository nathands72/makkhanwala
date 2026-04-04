"""Payment service – Razorpay and Stripe integration."""

import hmac
import hashlib
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories.order_repository import OrderRepository
from app.schemas.payment import (
    RazorpayOrderResponse,
    StripeSessionResponse,
    RazorpayVerifyRequest,
    PaymentStatusResponse,
)


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.order_repo = OrderRepository(db)

    async def create_razorpay_order(self, order_id: str, user_id: str) -> RazorpayOrderResponse:
        """Create a Razorpay order for payment."""
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if str(order.user_id) != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        if order.payment_status == "SUCCESS":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order already paid")

        try:
            import razorpay
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_SECRET))
            amount_paise = int(float(order.total_amount) * 100)

            razorpay_order = client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": str(order.id),
                "payment_capture": 1,
            })

            return RazorpayOrderResponse(
                order_id=str(order.id),
                razorpay_order_id=razorpay_order["id"],
                amount=amount_paise,
                currency="INR",
                key_id=settings.RAZORPAY_KEY_ID,
            )
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Payment creation failed: {str(e)}")

    async def verify_razorpay_payment(self, data: RazorpayVerifyRequest) -> PaymentStatusResponse:
        """Verify Razorpay payment signature and update order status."""
        order = await self.order_repo.get_by_id(data.order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        # Verify signature
        message = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
        expected_signature = hmac.new(
            settings.RAZORPAY_SECRET.encode(),
            message.encode(),
            hashlib.sha256,
        ).hexdigest()

        if expected_signature != data.razorpay_signature:
            await self.order_repo.update_status(order, payment_status="FAILED")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment signature")

        await self.order_repo.update_status(
            order,
            payment_status="SUCCESS",
            payment_id=data.razorpay_payment_id,
        )

        return PaymentStatusResponse(
            order_id=str(order.id),
            payment_status="SUCCESS",
            message="Payment verified successfully",
        )

    async def create_stripe_session(self, order_id: str, user_id: str) -> StripeSessionResponse:
        """Create a Stripe checkout session."""
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if str(order.user_id) != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        if order.payment_status == "SUCCESS":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order already paid")

        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY

            line_items = []
            for item in order.items:
                line_items.append({
                    "price_data": {
                        "currency": "inr",
                        "product_data": {"name": item.product_name},
                        "unit_amount": int(float(item.unit_price) * 100),
                    },
                    "quantity": item.quantity,
                })

            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=line_items,
                mode="payment",
                success_url=f"http://localhost:3000/orders/{order.id}?payment=success",
                cancel_url=f"http://localhost:3000/orders/{order.id}?payment=cancelled",
                metadata={"order_id": str(order.id)},
            )

            return StripeSessionResponse(
                order_id=str(order.id),
                session_id=session.id,
                url=session.url,
            )
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Stripe session failed: {str(e)}")

    async def handle_stripe_webhook(self, payload: bytes, sig_header: str) -> PaymentStatusResponse:
        """Handle Stripe webhook events."""
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY

            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET,
            )

            if event["type"] == "checkout.session.completed":
                session = event["data"]["object"]
                order_id = session["metadata"]["order_id"]
                order = await self.order_repo.get_by_id(order_id)
                if order:
                    await self.order_repo.update_status(
                        order,
                        payment_status="SUCCESS",
                        payment_id=session.get("payment_intent"),
                    )
                    return PaymentStatusResponse(
                        order_id=order_id,
                        payment_status="SUCCESS",
                        message="Stripe payment confirmed",
                    )

            return PaymentStatusResponse(
                order_id="",
                payment_status="PENDING",
                message=f"Webhook event type: {event['type']}",
            )
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Webhook error: {str(e)}")
