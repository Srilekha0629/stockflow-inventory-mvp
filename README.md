# StockFlow - Multi-Tenant SaaS Inventory Management MVP

StockFlow is a cloud-native, multi-tenant Software-as-a-Service (SaaS) inventory management MVP designed for an internship assessment.

---

## 🏗️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | High-performance SPA with fast HMR |
| **Styling** | Tailwind CSS, PostCSS | Modern responsive UI with utility-first styling |
| **Backend** | Node.js, Express | Modular REST API with ES Modules |
| **Database** | MySQL | Connection pooling with `mysql2/promise` |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` | Stateless tenant-aware security and hashed passwords |

---

## 📁 Project Structure

The project maintains a clean separation of concerns between client and server:

```text
stockflow-inventory-mvp/
├── .gitignore                     # Global gitignore (node_modules, .env, build outputs)
├── README.md                      # Complete setup and development documentation
├── backend/                       # Express REST API
│   ├── .env.example               # Backend environment variables template
│   ├── .gitignore                 # Backend-specific gitignore
│   ├── package.json               # Backend dependencies and scripts
│   └── src/
│       ├── app.js                 # Express app configuration & middleware
│       ├── server.js              # Server entrypoint with graceful shutdown
│       ├── config/
│       │   └── db.js              # MySQL connection pool configuration
│       ├── controllers/
│       │   └── health.controller.js # Health-check controller logic
│       ├── middleware/
│       │   └── error.middleware.js # 404 and global error handlers
│       └── routes/
│           └── health.routes.js   # Health check API route definitions
└── frontend/                      # React + Vite Client SPA
    ├── .env.example               # Frontend environment variables template
    ├── .gitignore                 # Frontend-specific gitignore
    ├── index.html                 # Main HTML entrypoint
    ├── package.json               # Frontend dependencies and scripts
    ├── postcss.config.js          # PostCSS configuration for Tailwind
    ├── tailwind.config.js         # Tailwind CSS configuration
    ├── vite.config.js             # Vite configuration with backend proxy
    ├── public/
    │   └── vite.svg               # Application icon
    └── src/
        ├── App.jsx                # Main dashboard & live health status monitor
        ├── index.css              # Tailwind CSS directives & global styling
        └── main.jsx               # React DOM entrypoint
```

---

## ⚙️ Prerequisites

Before getting started, make sure you have the following installed on your system:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **MySQL**: v8.0 or higher ([Download MySQL](https://dev.mysql.com/downloads/)) or running via Docker

---

## 🚀 Getting Started

Follow these steps to initialize and run both the frontend and backend applications.

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file from the template:
   - On Windows (PowerShell):
     ```powershell
     Copy-Item .env.example .env
     ```
   - On Linux/macOS:
     ```bash
     cp .env.example .env
     ```

4. Configure your `.env` variables with your MySQL credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=stockflow_db

   JWT_SECRET=your_jwt_secret_key_change_in_production
   JWT_EXPIRES_IN=24h
   ```

5. Initialize the MySQL database and tables:
   ```bash
   npm run db:init
   ```
   *(This connects to MySQL, creates `stockflow_db` if not present, and applies `src/config/schema.sql` to generate `organizations`, `users`, and `products` tables.)*

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *For production mode:*
   ```bash
   npm start
   ```

6. Verify backend health check:
   - Open your browser or run:
     ```bash
     curl http://localhost:5000/api/health
     ```
   - Expected response:
     ```json
     {
       "status": "ok",
       "service": "StockFlow Backend API",
       "version": "1.0.0",
       "uptime": "2.45s",
       "timestamp": "2026-11-03T12:45:00.000Z",
       "environment": "development",
       "database": {
         "status": "connected",
         "details": "Successfully connected to MySQL database pool."
       }
     }
     ```

---

### 2. Frontend Setup

1. Open a new terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from the template:
   - On Windows (PowerShell):
     ```powershell
     Copy-Item .env.example .env
     ```
   - On Linux/macOS:
     ```bash
     cp .env.example .env
     ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```

5. Open your browser:
   Visit **[http://localhost:5173](http://localhost:5173)**. You will see the StockFlow landing dashboard, which automatically tests connection to the backend `/api/health` endpoint and displays the system status.

---

## 🔒 Security & Secrets Management

- Sensitive configuration keys (`DB_PASSWORD`, `JWT_SECRET`) are loaded strictly from environment variables via `dotenv`.
- Neither `.env` nor `.env.*` files are tracked in git (enforced via `.gitignore`).
- Only sanitized `.env.example` templates with placeholder values are committed to the repository.

---

## 📦 Installed Dependencies Summary

### Backend (`backend/package.json`)
- **`express`**: Fast, unopinionated, minimalist web framework.
- **`cors`**: Middleware to enable Cross-Origin Resource Sharing with the frontend client.
- **`dotenv`**: Zero-dependency module that loads environment variables from `.env`.
- **`mysql2`**: Fast MySQL driver supporting connection pooling and async/await (`mysql2/promise`).
- **`jsonwebtoken`**: Industry-standard JSON Web Token implementation for stateless auth.
- **`bcryptjs`**: Optimized, pure JavaScript password hashing library.
- **`nodemon`** *(dev)*: Automatically restarts the server upon file changes during development.

### Frontend (`frontend/package.json`)
- **`react`** & **`react-dom`**: Modern React framework with hooks and functional components.
- **`lucide-react`**: Clean, customizable SVG icons.
- **`vite`** *(dev)*: Next-generation frontend build tool and dev server.
- **`@vitejs/plugin-react`** *(dev)*: Official Vite plugin for React Fast Refresh.
- **`tailwindcss`** *(dev)*: Utility-first CSS framework.
- **`postcss`** & **`autoprefixer`** *(dev)*: CSS post-processing pipeline.

---

## 🛣️ API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API Information & Service Overview | No |
| `GET` | `/api/health` | Service and Database Connectivity Status | No |
| `POST` | `/api/auth/signup` | Register new organization & primary user (atomic transaction) | No |
| `POST` | `/api/auth/login` | Authenticate user and return session JWT with tenant scope | No |

---

## 🏢 Multi-Tenant Architecture Roadmap (Future Steps)

In subsequent stages of the assessment, StockFlow will support:
1. **Tenant Isolation**: Row-level tenancy with a `tenant_id` foreign key on all domain models (tenants, users, products, categories, transactions, warehouses).
2. **Tenant Context Middleware**: Extracting `tenant_id` from validated JWT bearer tokens to scope all database operations.
3. **Role-Based Access Control (RBAC)**: Roles (`Admin`, `Manager`, `Staff`) scoped per tenant.
4. **Audit Logging**: Tracking all inventory movements, stock additions, and deductions.
