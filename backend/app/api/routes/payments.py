"""Payment routes."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.payment import (
    PaymentCreateRequest,
    RazorpayOrderResponse,
    StripeSessionResponse,
    RazorpayVerifyRequest,
    PaymentStatusResponse,
)
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("/create-order")
async def create_payment_order(
    data: PaymentCreateRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PaymentService(db)
    if data.provider == "stripe":
        return await service.create_stripe_session(data.order_id, str(current_user.id))
    else:
        return await service.create_razorpay_order(data.order_id, str(current_user.id))


@router.post("/verify", response_model=PaymentStatusResponse)
async def verify_payment(
    data: RazorpayVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    service = PaymentService(db)
    return await service.verify_razorpay_payment(data)


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    service = PaymentService(db)
    return await service.handle_stripe_webhook(payload, sig_header)
