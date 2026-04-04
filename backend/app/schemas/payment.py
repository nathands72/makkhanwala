"""Payment request/response schemas."""

from pydantic import BaseModel


class PaymentCreateRequest(BaseModel):
    order_id: str
    provider: str = "razorpay"  # razorpay | stripe


class RazorpayOrderResponse(BaseModel):
    order_id: str
    razorpay_order_id: str
    amount: int  # in paise
    currency: str
    key_id: str


class StripeSessionResponse(BaseModel):
    order_id: str
    session_id: str
    url: str


class RazorpayVerifyRequest(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class StripeVerifyRequest(BaseModel):
    order_id: str
    session_id: str


class PaymentStatusResponse(BaseModel):
    order_id: str
    payment_status: str
    message: str
