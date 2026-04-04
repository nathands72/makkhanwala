/* ── Makkanwala TypeScript Types ── */

// Auth
export interface User {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    role: 'CUSTOMER' | 'ADMIN';
    is_active: boolean;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

// Products
export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    weight: number;
    image_url: string | null;
    stock: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductListResponse {
    products: Product[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// Cart
export interface CartItem {
    id: string;
    product_id: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface Cart {
    id: string;
    items: CartItem[];
    total: number;
    item_count: number;
}

// Orders
export interface OrderItem {
    id: string;
    product_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface Order {
    id: string;
    user_id: string | null;
    total_amount: number;
    payment_status: 'PENDING' | 'SUCCESS' | 'FAILED';
    order_status: 'PLACED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
    delivery_address: string;
    payment_id: string | null;
    payment_provider: string | null;
    items: OrderItem[];
    created_at: string;
}

export interface OrderListResponse {
    orders: Order[];
    total: number;
    page: number;
    page_size: number;
}

// Admin Dashboard
export interface DashboardStats {
    total_users: number;
    total_orders: number;
    total_revenue: number;
    orders_by_status: Record<string, number>;
    low_stock_products: { id: string; name: string; stock: number; price: string }[];
    recent_orders: {
        id: string;
        total_amount: string;
        order_status: string;
        payment_status: string;
        created_at: string;
    }[];
}

// Payment
export interface RazorpayOrder {
    order_id: string;
    razorpay_order_id: string;
    amount: number;
    currency: string;
    key_id: string;
}
