# 🧾 Smart AI Billing & Customer Management System

**A full-stack production-ready MERN application for shopkeepers — with AI-powered natural language bill entry, customer management, return & refund tracking, PDF invoice export, and a real-time analytics dashboard.**

---

## 📌 Overview

Smart Billing is a complete shop management system built for small to medium retailers. Shopkeepers can create bills by simply typing natural language like **"2 soaps 30 each and 1 shampoo 120"** and the AI extracts all items instantly. It includes customer tracking, purchase history, return/refund management, and a live revenue dashboard — all in a clean, responsive UI with dark mode.

---

## ✨ Features

### 🤖 AI-Powered Bill Entry
- Type natural language: `"2 soaps 30 each and 1 shampoo 120"` → items auto-fill
- **Voice input** via Web Speech API (Chrome/Edge)
- **3-layer resilience**: OpenAI → Regex fallback → Client-side parsing
- **Exponential backoff retry** on OpenAI rate limits (429)
- Smart item suggestions based on purchase history

### 🧾 Bill Generation
- Add / edit / delete items inline
- Auto-calculated subtotal, GST, and discount
- Discount system: percentage or fixed amount
- GST toggle with configurable rate
- Payment method: Cash / Card / UPI / Other
- Payment status: Paid / Pending / Partial
- **Export to PDF** (professional invoice via jsPDF)
- Auto-save draft bills

### 👤 Customer Management
- Full CRUD: Create, search, edit, delete customers
- Track total purchases, total spent, last visit
- Full purchase history per customer
- Search by name or phone number

### 🔁 Return & Refund System
- Search bills by number or customer name
- Select individual items and quantities to return
- Auto-calculates refund amount per item
- Maintains complete return history on each bill
- Updates customer spend totals automatically

### 📊 Dashboard & Analytics
- Today's sales + total revenue stats
- 7-day revenue area chart (Recharts)
- Top 5 selling items bar chart
- Recent bills table
- Total customer count

### 🔐 Authentication
- JWT-based login / register
- Password hashing with bcryptjs (12 salt rounds)
- Token auto-injection on all API requests
- Auto-logout on 401 with redirect

### 🎨 UI / UX
- Responsive design (mobile, tablet, desktop)
- Dark mode (persisted to localStorage)
- Collapsible sidebar with mobile overlay
- Toast notifications (react-hot-toast)
- Custom Tailwind component classes

---

## 🗂 Project Structure

```
smart-billing/
│
├── README.md
│
├── backend/                          # Node.js + Express REST API
│   ├── server.js                     # Entry: Express, CORS, Morgan, routes
│   ├── package.json
│   ├── .env.example
│   │
│   ├── config/
│   │   └── db.js                     # Mongoose connection
│   │
│   ├── models/                       # MongoDB Schemas
│   │   ├── User.js                   # Shopkeeper account + settings
│   │   ├── Customer.js               # Customer profile + stats
│   │   └── Bill.js                   # Bill + embedded items + return history
│   │
│   ├── controllers/                  # Business logic (MVC)
│   │   ├── authController.js         # register, login, getMe, updateProfile
│   │   ├── billController.js         # CRUD bills, dashboard stats, returns
│   │   ├── customerController.js     # CRUD customers, search
│   │   └── aiController.js           # OpenAI parse + regex fallback + suggestions
│   │
│   ├── middleware/
│   │   ├── auth.js                   # JWT protect + adminOnly
│   │   └── errorHandler.js           # Global error handler
│   │
│   └── routes/
│       ├── authRoutes.js
│       ├── billRoutes.js
│       ├── customerRoutes.js
│       └── aiRoutes.js
│
└── frontend/                         # React 18 + Tailwind CSS SPA
    ├── package.json
    ├── tailwind.config.js
    ├── .env.example
    │
    ├── public/
    │   └── index.html
    │
    └── src/
        ├── App.jsx                   # Routes + Toaster + Auth wrapper
        ├── index.js                  # ReactDOM entry
        ├── index.css                 # Tailwind + global component classes
        │
        ├── api/
        │   └── axios.js              # Axios instance, JWT interceptor, 401 redirect
        │
        ├── context/
        │   └── AuthContext.jsx       # Global auth state + dark mode
        │
        ├── utils/
        │   └── helpers.js            # formatCurrency, formatDate, generatePDF, statusColor
        │
        ├── components/
        │   ├── common/
        │   │   ├── Layout.jsx        # Shell: Sidebar + Topbar + Outlet
        │   │   ├── Sidebar.jsx       # Nav, shop name, logout, mobile overlay
        │   │   ├── Topbar.jsx        # Dark mode toggle, avatar, hamburger
        │   │   └── ProtectedRoute.jsx
        │   │
        │   ├── billing/
        │   │   ├── AIInputPanel.jsx  # OpenAI UI + voice + fallback + warnings
        │   │   ├── BillItemsTable.jsx# Inline add/edit/delete items
        │   │   └── BillSummary.jsx   # Discount + GST + live totals
        │   │
        │   └── dashboard/
        │       └── StatCard.jsx      # Metric card with icon + trend
        │
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx         # Stats + charts + recent bills
            ├── NewBill.jsx           # Full bill creation page
            ├── Bills.jsx             # Paginated bills list
            ├── BillDetail.jsx        # Invoice view + PDF export
            ├── Customers.jsx         # Customer grid + add modal
            ├── CustomerDetail.jsx    # Profile + full history + edit
            ├── Returns.jsx           # Search → select items → refund
            └── Settings.jsx          # Profile, GST, currency, dark mode
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend Framework | React 18 | UI, routing, state |
| Styling | Tailwind CSS 3 | Utility-first responsive design |
| Charts | Recharts | Dashboard area + bar charts |
| PDF Export | jsPDF + jsPDF-autotable | Professional invoice generation |
| HTTP Client | Axios | API requests + interceptors |
| Notifications | react-hot-toast | Toast alerts |
| Icons | react-icons (MD) | Material Design icon set |
| Backend Framework | Node.js + Express.js | REST API server |
| Database | MongoDB + Mongoose | Document storage + schemas |
| Authentication | JWT + bcryptjs | Secure auth + password hashing |
| AI Integration | OpenAI API (GPT-3.5) | Natural language bill parsing |
| Dev Tools | nodemon, morgan | Hot reload + HTTP logging |

---

## ⚡ Quick Start

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| MongoDB | v6+ (local) or Atlas | [mongodb.com](https://mongodb.com) |
| OpenAI API Key | Any plan | [platform.openai.com](https://platform.openai.com/api-keys) |

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/smart-billing.git
cd smart-billing
```

---

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/smart-billing
JWT_SECRET=your_very_long_random_secret_key_here
JWT_EXPIRE=30d
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx
CLIENT_URL=http://localhost:3000
```

Start the backend server:

```bash
npm run dev        # development with nodemon (auto-restart)
npm start          # production
```

> ✅ Backend runs at `http://localhost:5000`

---

### 3. Setup Frontend

```bash
cd ../frontend
npm install
cp .env.example .env
```

`.env` is already correct for local development:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm start
```

> ✅ Frontend runs at `http://localhost:3000`

---

### 4. Open in Browser

Navigate to **http://localhost:3000** → Click **"Create one"** → Register your shop → Start billing!

---

## 🔑 API Endpoints

All protected routes require `Authorization: Bearer <token>` header.

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | ❌ | Register a new shopkeeper |
| `POST` | `/login` | ❌ | Login, returns JWT token |
| `GET` | `/me` | ✅ | Get current logged-in user |
| `PUT` | `/profile` | ✅ | Update profile and settings |

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@myshop.com",
  "password": "secret123",
  "shopName": "John's General Store",
  "phone": "+91 98765 43210",
  "gstNumber": "22AAAAA0000A1Z5"
}
```

**Login response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "name": "John", "shopName": "John's Store", "role": "admin" }
}
```

---

### 👤 Customers — `/api/customers`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ✅ | List all customers (supports `?search=` `?page=` `?limit=`) |
| `POST` | `/` | ✅ | Create new customer |
| `GET` | `/:id` | ✅ | Get customer + full bill history |
| `PUT` | `/:id` | ✅ | Update customer details |
| `DELETE` | `/:id` | ✅ | Delete customer |

---

### 🧾 Bills — `/api/bills`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ✅ | List bills (supports `?status=` `?startDate=` `?endDate=` `?customerId=`) |
| `POST` | `/` | ✅ | Create new bill |
| `GET` | `/dashboard` | ✅ | Dashboard stats, charts data, recent bills |
| `GET` | `/:id` | ✅ | Get single bill with full details |
| `PUT` | `/:id` | ✅ | Update bill |
| `POST` | `/:id/return` | ✅ | Process item return / refund |

**Create bill body:**
```json
{
  "customerId": "optional_mongo_id",
  "customerName": "Walk-in Customer",
  "items": [
    { "itemName": "Soap", "price": 30, "quantity": 2 },
    { "itemName": "Shampoo", "price": 120, "quantity": 1 }
  ],
  "discountType": "percentage",
  "discountValue": 10,
  "gstEnabled": true,
  "gstRate": 18,
  "paymentMethod": "cash",
  "paymentStatus": "paid",
  "status": "final"
}
```

---

### 🤖 AI — `/api/ai`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/parse-bill` | ✅ | Parse natural language text → items JSON |
| `GET` | `/suggestions` | ✅ | Get top 10 frequently sold items |

**Parse bill request:**
```json
{ "text": "2 soaps 30 each and 1 shampoo 120" }
```

**Parse bill response (OpenAI succeeded):**
```json
{
  "success": true,
  "parseMethod": "openai",
  "warning": null,
  "items": [
    { "itemName": "soap",    "price": 30,  "quantity": 2 },
    { "itemName": "shampoo", "price": 120, "quantity": 1 }
  ]
}
```

**Parse bill response (fallback used):**
```json
{
  "success": true,
  "parseMethod": "regex",
  "warning": "AI is rate-limited right now. Items parsed using smart pattern matching instead.",
  "items": [
    { "itemName": "soap",    "price": 30,  "quantity": 2 },
    { "itemName": "shampoo", "price": 120, "quantity": 1 }
  ]
}
```

---

## 🗃 Database Schema

### User
```
name          String   required
email         String   required, unique
password      String   hashed with bcrypt (12 rounds)
shopName      String   required
phone         String
address       String
role          String   enum: admin | staff  (default: admin)
gstNumber     String
settings {
  gstEnabled  Boolean  default: false
  gstRate     Number   default: 18
  currency    String   default: INR
  darkMode    Boolean  default: false
}
```

### Customer
```
shopkeeper    ObjectId  ref: User
name          String    required
phone         String
email         String
address       String
notes         String
totalPurchases Number   default: 0
totalSpent     Number   default: 0
lastVisit      Date
```

### Bill
```
billNumber      String    auto-generated: INV-2604-0001
shopkeeper      ObjectId  ref: User
customer        ObjectId  ref: Customer (optional)
customerSnapshot {name, phone, address}   stored for history
items [{
  itemName        String
  price           Number
  quantity        Number
  subtotal        Number
  returnedQuantity Number  default: 0
}]
subtotal          Number
discountType      String   none | percentage | fixed
discountValue     Number
discountAmount    Number
gstEnabled        Boolean
gstRate           Number
gstAmount         Number
totalAmount       Number
paymentStatus     String   paid | pending | partial | refunded
paymentMethod     String   cash | card | upi | other
paidAmount        Number
status            String   draft | final | cancelled
notes             String
returnHistory [{
  date        Date
  items [{itemName, quantity, refundAmount}]
  totalRefund Number
  reason      String
}]
```

---

## 🤖 AI Parsing — How It Works

The AI bill entry uses a **3-layer resilience architecture** to ensure it never fully fails:

```
User Input Text
      │
      ▼
┌─────────────────────────────┐
│  Layer 1: OpenAI GPT-3.5   │  ← Up to 3 retries with exponential backoff
│  Retry: 2s → 4s → 8s       │    Reads Retry-After header from response
└─────────────┬───────────────┘
              │ FAIL (429 / 401 / 503 / network)
              ▼
┌─────────────────────────────┐
│  Layer 2: Regex Parser      │  ← Pure pattern matching, zero API dependency
│  Handles 5 input patterns   │    Works offline, instant response
└─────────────┬───────────────┘
              │ FAIL (no pattern matched)
              ▼
┌─────────────────────────────┐
│  Layer 3: Clear Error +     │  ← Returns 422 with format hint
│  Manual Entry Hint          │    Never shows a raw 500 to the user
└─────────────────────────────┘
```

**Regex patterns supported:**
```
"2 soaps 30"           →  qty  name  price
"soap 30 2"            →  name price  qty
"soap 30"              →  name price  (qty = 1)
"30 soap"              →  price name  (qty = 1)
"soap x2 30"           →  name × qty  price
```

Additionally, the **frontend** has its own client-side regex fallback — if the HTTP request itself fails (offline/network error), items are parsed directly in the browser.

---

## 🌍 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret key for JWT signing (32+ chars) |
| `JWT_EXPIRE` | No | Token expiry (default: `30d`) |
| `OPENAI_API_KEY` | **Yes** | OpenAI API key (sk-...) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: localhost:3000) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_API_URL` | **Yes** | Backend API base URL |

> ⚠️ **Never commit `.env` to GitHub.** Both `.env` files are in `.gitignore`. Only `.env.example` files are committed.

---

## 🚀 Deployment

### Backend — Railway / Render / Heroku

1. Create a new project on [Railway](https://railway.app) or [Render](https://render.com)
2. Connect your GitHub repository
3. Set environment variables in the platform dashboard:
```
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/smart-billing
JWT_SECRET=your_long_random_secret
OPENAI_API_KEY=sk-proj-xxxx
CLIENT_URL=https://your-frontend.vercel.app
```
4. Set start command: `npm start`

### Frontend — Vercel / Netlify

1. Push code to GitHub
2. Connect repo to [Vercel](https://vercel.com)
3. Set environment variable:
```
REACT_APP_API_URL=https://your-backend.railway.app/api
```
4. Build command: `npm run build`
5. Output directory: `build`

---

## 📦 All Dependencies

### Backend
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.3",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "openai": "^4.20.1",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "morgan": "^1.10.0",
  "express-validator": "^7.0.1"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.21.1",
  "axios": "^1.6.2",
  "recharts": "^2.10.3",
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.8.2",
  "react-hot-toast": "^2.4.1",
  "react-icons": "^4.12.0"
}
```

---

## 🧪 Testing the API

You can test all endpoints with the following curl commands:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"pass123","shopName":"Test Shop"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'

# Parse bill with AI (replace TOKEN)
curl -X POST http://localhost:5000/api/ai/parse-bill \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"text":"2 soaps 30 each and 1 shampoo 120"}'

# Dashboard stats
curl -X GET http://localhost:5000/api/bills/dashboard \
  -H "Authorization: Bearer TOKEN"
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes with clean, commented code
4. Commit: `git commit -m "feat: add your feature description"`
5. Push: `git push origin feature/your-feature-name`
6. Open a **Pull Request** with a clear description

### Commit Convention
```
feat:     New feature
fix:      Bug fix
docs:     Documentation update
style:    Formatting, no logic change
refactor: Code restructure, no feature change
perf:     Performance improvement
test:     Tests added or updated
```

---

## 🐛 Known Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `429 Too Many Requests` on AI parse | OpenAI rate limit | Auto-retry with backoff + regex fallback (already fixed) |
| Voice input not working | Browser not supported | Use Chrome or Edge |
| PDF export blank | jsPDF not loaded | Ensure `jspdf` and `jspdf-autotable` are installed |
| CORS error | Wrong `CLIENT_URL` in backend `.env` | Set `CLIENT_URL=http://localhost:3000` |
| MongoDB connection refused | MongoDB not running | Start with `mongod` or use Atlas URI |

---

## 📄 License

This project is licensed under the **MIT License** — free to use for personal and commercial projects.

```
MIT License — Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software.
```

---

## 👨‍💻 Author

Built with ❤️ using the MERN stack + OpenAI.

If this project helped you, please ⭐ **star the repository** — it means a lot!

---Made with React • Node.js • MongoDB • OpenAI

</div>
