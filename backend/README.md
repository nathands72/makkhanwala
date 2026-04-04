# 🧈 Makkanwala – Backend API

A production-ready **FastAPI** backend for the Makkanwala butter ordering platform. Built with async SQLAlchemy, PostgreSQL, JWT auth, and clean architecture principles.

---

## 🏗️ Architecture

```
backend/
├── app/
│   ├── api/routes/          # API endpoint handlers
│   │   ├── auth.py          # Register, Login, Refresh, Forgot-password, Me
│   │   ├── products.py      # Public listing + Admin CRUD
│   │   ├── cart.py           # Get, Add, Update, Remove items
│   │   ├── orders.py         # Customer orders + Admin status updates
│   │   ├── payments.py       # Razorpay & Stripe integration
│   │   └── admin.py          # Dashboard analytics
│   ├── core/
│   │   ├── config.py         # Pydantic Settings (env-based config)
│   │   └── security.py       # JWT utilities, password hashing, RBAC
│   ├── db/
│   │   ├── base.py           # Declarative base + mixins (UUID, Timestamp, SoftDelete)
│   │   └── session.py        # Async engine & session factory
│   ├── middleware/
│   │   └── security_headers.py  # Helmet-style security headers
│   ├── models/               # SQLAlchemy ORM models
│   │   ├── user.py           # User (CUSTOMER / ADMIN roles)
│   │   ├── product.py        # Product (soft-delete support)
│   │   ├── cart.py            # Cart & CartItem (auto-total)
│   │   └── order.py           # Order & OrderItem (payment tracking)
│   ├── repositories/         # Data access layer (async queries)
│   ├── schemas/              # Pydantic request/response schemas
│   ├── services/             # Business logic layer
│   └── main.py               # FastAPI app entry point
├── alembic/                  # Database migrations
├── tests/                    # Pytest test suite
├── seed.py                   # DB seed script (admin + products)
├── requirements.txt          # Python dependencies
├── Dockerfile                # Container build
└── .env.example              # Environment variable template
```

**Pattern:** Repository → Service → Route (Clean Architecture with Dependency Injection)

---

## ⚡ Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 14+

### 1. Setup Environment

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
copy .env.example .env
```

Edit `.env` with your values:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql+asyncpg://postgres:postgres@localhost:5432/makkhanwala` |
| `JWT_SECRET` | Token signing key | `your-super-secret-key-here` |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `RAZORPAY_KEY_ID` | Razorpay API key | `rzp_test_xxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | `your_razorpay_secret` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_xxxxxxxxxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_xxxxxxxxxxxx` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:3000` |

### 3. Run Migrations

```bash
alembic upgrade head
```

### 4. Seed Database (Optional)

```bash
python seed.py
```

Creates:
- **Admin:** `admin@makkanwala.com` / `admin123`
- **Customer:** `customer@makkanwala.com` / `customer123`
- **5 sample products** (Salted Butter, White Butter, etc.)

### 5. Start Server

```bash
uvicorn app.main:app --reload --port 8000
```

API is live at **http://localhost:8000**

---

## 📚 API Endpoints

### Authentication `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | ✗ | Create a new account |
| `POST` | `/login` | ✗ | Get access + refresh tokens |
| `POST` | `/refresh` | ✗ | Refresh access token |
| `POST` | `/forgot-password` | ✗ | Request password reset |
| `GET` | `/me` | ✓ | Get current user profile |

### Products `/api/products`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ✗ | List products (search, filter, paginate) |
| `POST` | `/admin/products` | Admin | Create product |
| `PUT` | `/admin/products/{id}` | Admin | Update product |
| `DELETE` | `/admin/products/{id}` | Admin | Soft-delete product |

### Cart `/api/cart`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ✓ | Get current cart |
| `POST` | `/add` | ✓ | Add item to cart |
| `PUT` | `/update` | ✓ | Update item quantity |
| `DELETE` | `/remove/{item_id}` | ✓ | Remove item from cart |

### Orders `/api/orders`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/` | ✓ | Create order from cart |
| `GET` | `/` | ✓ | List user's orders |
| `GET` | `/admin/orders` | Admin | List all orders |
| `PUT` | `/admin/orders/{id}/status` | Admin | Update order status |

### Payments `/api/payments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/create-order` | ✓ | Create Razorpay/Stripe payment order |
| `POST` | `/verify` | ✓ | Verify Razorpay payment signature |
| `POST` | `/stripe-webhook` | ✗ | Stripe webhook handler |

### Admin `/api/admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/dashboard` | Admin | Dashboard stats (revenue, users, low stock) |

---

## 🔐 Authentication

- **JWT Access Token** — expires in 15 minutes
- **JWT Refresh Token** — expires in 7 days
- Passwords hashed with **bcrypt**
- Role-based access: `CUSTOMER` and `ADMIN`

**Header format:**
```
Authorization: Bearer <access_token>
```

---

## 🧪 Testing

```bash
pytest
```

Tests use an **in-memory SQLite** database for isolation. Fixtures provide pre-authenticated admin/customer tokens and sample product data.

---

## 🐳 Docker

```bash
# From project root (one level up)
docker-compose up --build
```

The backend Dockerfile runs migrations automatically on startup.

**Standalone:**
```bash
docker build -t makkanwala-backend .
docker run -p 8000:8000 --env-file .env makkanwala-backend
```

---

## 📖 API Documentation

Once running, interactive docs are available at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 🛡️ Security Features

- **CORS** middleware with configurable origins
- **Rate limiting** via SlowAPI
- **Security headers** (X-Frame-Options, X-Content-Type-Options, CSP, HSTS)
- **Soft-delete** for products (data retention)
- **Input validation** via Pydantic schemas

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `sqlalchemy[asyncio]` | Async ORM |
| `asyncpg` | PostgreSQL driver |
| `alembic` | Database migrations |
| `pydantic-settings` | Config management |
| `python-jose` | JWT tokens |
| `passlib[bcrypt]` | Password hashing |
| `razorpay` | Razorpay payment SDK |
| `stripe` | Stripe payment SDK |
| `slowapi` | Rate limiting |
| `uvicorn` | ASGI server |
| `pytest` / `httpx` | Testing |

---

## 📄 License

MIT
