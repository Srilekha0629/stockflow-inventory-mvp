# StockFlow – Multi-Tenant SaaS Inventory Management System

StockFlow is a full-stack, multi-tenant inventory management application that helps organizations manage their products, monitor inventory levels, and identify low-stock items through a centralized dashboard.

The application allows multiple organizations to maintain their own independent inventory data. Each user is associated with an organization, and all product operations are restricted to that organization.

This project was developed as a full-stack internship assessment to demonstrate REST API development, database management, authentication, and multi-tenant architecture.

**GitHub Repository:** https://github.com/Srilekha0629/stockflow-inventory-mvp

---

## 1. Project Overview

Managing inventory manually can make it difficult to track product quantities, maintain accurate records, and identify items that need restocking.

StockFlow provides a centralized system where organizations can:

- Create an account and manage their inventory workspace.
- Add, view, update, and delete products.
- Track product quantities and pricing information.
- Set individual low-stock thresholds.
- Monitor inventory through a dashboard.
- Keep their inventory data separate from other organizations.

The application follows a multi-tenant architecture, allowing multiple organizations to use the same application while maintaining data isolation.

## 2. Key Features

### 2.1 User Authentication

- User registration with name, email, password, and organization name.
- User login using email and password.
- Password hashing using bcrypt.
- JWT-based authentication for protected API endpoints.
- Token-based user session handling.
- Validation for required fields and invalid credentials.

### 2.2 Organization Management

- An organization is created during user registration.
- The registered user is associated with the newly created organization.
- Each user receives access to their organization's inventory.
- Organization identification is maintained through authenticated requests.

### 2.3 Product Management

Users can manage products with the following information:

| Field | Description |
|---|---|
| Product Name | Name of the product |
| SKU | Unique product identifier within an organization |
| Description | Additional product details |
| Quantity | Available stock quantity |
| Cost Price | Purchase or cost price |
| Selling Price | Product selling price |
| Low Stock Threshold | Minimum stock level used for low-stock identification |

Available operations:

- Add new products.
- View the product catalog.
- Search products by name or SKU.
- Edit existing product details.
- Delete products with confirmation.
- Validate product information before saving.
- Prevent duplicate SKUs within the same organization.

### 2.4 Inventory Dashboard

The dashboard provides an overview of the organization's inventory.

It displays:

- **Total Products:** Number of products maintained by the organization.
- **Total Stock Quantity:** Combined quantity of all products.
- **Low Stock Alerts:** Number of products whose quantities are at or below their configured thresholds.
- **Low Stock Products:** A list of products that require attention.

The dashboard updates based on the latest inventory information.

### 2.5 Multi-Tenant Data Isolation

StockFlow supports multiple organizations using a shared application and database.

For data isolation:

- Each organization has its own organization ID.
- Users are associated with their respective organizations.
- Authentication middleware verifies the JWT token.
- The organization ID is obtained from the authenticated user context.
- Product queries are restricted using the organization ID.
- Organizations can use the same SKU without conflicting with one another.
- Users cannot view, update, or delete products belonging to another organization.

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 | Building the user interface |
| Build Tool | Vite | Frontend development and build |
| Styling | Tailwind CSS | Responsive UI styling |
| Backend | Node.js | Server-side runtime |
| Backend Framework | Express.js | REST API development |
| Database | MySQL | Persistent data storage |
| Database Driver | mysql2 | MySQL connectivity |
| Authentication | JSON Web Token (JWT) | Securing API requests |
| Password Security | bcryptjs | Password hashing |
| API Architecture | REST APIs | Frontend-backend communication |
| Version Control | Git and GitHub | Source code management |

## 4. Application Architecture

StockFlow follows a frontend-backend-database architecture.

```text
              User
               |
               v
        React Frontend
       (Vite + Tailwind)
               |
               | HTTP Requests
               | JWT Authentication
               v
        Express Backend
               |
        +------+--------+
        |       |       |
        v       v       v
     Auth API Product Dashboard
              API      API
        |       |       |
        +-------+-------+
                |
                v
          MySQL Database
                |
        +-------+--------+
        |       |        |
        v       v        v
   Organizations Users  Products
```

### Request Flow

1. The user interacts with the React frontend.
2. The frontend sends requests to the Express backend.
3. Public authentication endpoints handle signup and login.
4. Protected endpoints validate the JWT token through authentication middleware.
5. The authenticated user's organization ID determines which inventory records can be accessed.
6. The backend communicates with MySQL and returns the requested data.
7. The frontend displays the updated information.

## 5. Database Design

The application uses MySQL for persistent storage.

The database is initialized using the schema file and database initialization script.

### Organizations

Stores organization information.

- Organization ID
- Organization name
- Organization-related timestamps and fields defined in the schema

### Users

Stores registered user information.

- User ID
- Name
- Email
- Hashed password
- Organization ID
- Relevant timestamps

The organization ID links each user to their organization.

### Products

Stores inventory information.

- Product ID
- Organization ID
- Product name
- SKU
- Description
- Quantity
- Cost price
- Selling price
- Low-stock threshold
- Relevant timestamps

A composite uniqueness constraint on organization ID and SKU allows different organizations to maintain products with the same SKU while preventing duplicate SKUs within one organization.

## 6. Project Structure

The project is divided into two main applications.

```text
stockflow-inventory-mvp/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   ├── initDb.js
│   │   │   └── schema.sql
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── health.controller.js
│   │   │   └── product.controller.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── error.middleware.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── health.routes.js
│   │   │   └── product.routes.js
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   └── product.service.js
│   │   │
│   │   ├── tests/
│   │   │   ├── auth.test.js
│   │   │   └── products.test.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Products.jsx
│   │   │   └── Signup.jsx
│   │   │
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

*Note: This is a logical overview of the main implementation files. Refer to the repository for the complete source tree.*

## 7. Prerequisites

Make sure the following software is installed:

- Node.js
- npm
- MySQL Server
- Git

## 8. Installation and Setup

Follow these steps to run StockFlow locally.

### Step 1: Clone the Repository

```bash
git clone https://github.com/Srilekha0629/stockflow-inventory-mvp.git
cd stockflow-inventory-mvp
```

### Step 2: Configure the Backend

Navigate to the backend directory:

```powershell
cd backend
npm install
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Open the `.env` file and configure your local MySQL connection details and JWT secret.

Example configuration (use the exact variable names from `.env.example`):

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=stockflow_db

JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=24h
```

Do not use this example blindly if your actual `.env.example` contains different variable names.

### Step 3: Initialize the Database

Make sure your MySQL server is running.

Run:

```powershell
npm run db:init
```

This initializes the StockFlow database and creates the required tables:

- organizations
- users
- products

### Step 4: Start the Backend Server

From the `backend` directory:

```powershell
node src/server.js
```

The backend server runs at:

`http://localhost:5000`

Check backend health:

`http://localhost:5000/api/health`

### Step 5: Configure and Start the Frontend

Open a new terminal and navigate to the frontend directory:

```powershell
cd frontend
npm install
```

Configure the frontend API URL:

```powershell
$env:VITE_API_BASE_URL="http://localhost:5000/api"
```

Start the development server:

```powershell
npm run dev
```

Open the local URL displayed by Vite. The default development URL is:

`http://localhost:5173`

The frontend and backend should both be running while using the application.

## 9. API Documentation

The backend exposes REST API endpoints for authentication, inventory management, and dashboard information.

### 9.1 Health Check

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/api/health` | Checks backend and database status | Not required |

### 9.2 Authentication APIs

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/api/auth/signup` | Registers a user and creates an organization | Not required |
| POST | `/api/auth/login` | Authenticates an existing user | Not required |

### Signup Request Example

```json
{
  "name": "Jane Founder",
  "email": "jane@example.com",
  "password": "password123",
  "organizationName": "Apex Global Logistics"
}
```

### Login Request Example

```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

### 9.3 Product APIs

All product endpoints require a valid JWT Bearer token.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Retrieves products belonging to the authenticated organization |
| POST | `/api/products` | Creates a new product |
| GET | `/api/products/summary` | Retrieves inventory dashboard information |
| GET | `/api/products/:id` | Retrieves a specific product |
| PUT | `/api/products/:id` | Updates an existing product |
| DELETE | `/api/products/:id` | Deletes a product |

### Product Creation Request Example

```json
{
  "name": "Industrial Valve",
  "sku": "VALVE-001",
  "description": "Steel industrial valve",
  "quantity": 20,
  "costPrice": 500,
  "sellingPrice": 750,
  "lowStockThreshold": 5
}
```

### Authentication Header

For protected API requests:

```http
Authorization: Bearer <your_jwt_token>
```

The backend validates the token and uses the authenticated organization context to restrict product access.

## 10. Testing

StockFlow includes backend tests for authentication, product management, and multi-tenant data isolation.

Run the commands from the `backend` directory.

### Authentication Tests

```bash
npm test
```

Covers:

- User registration.
- Password hashing.
- Duplicate email handling.
- Login validation.
- JWT generation and verification.
- Authentication error handling.

### Product and Multi-Tenant Tests

```bash
npm run test:products
```

Covers:

- Product creation and retrieval.
- Product updates and deletion.
- Product validation.
- SKU uniqueness within an organization.
- Organization-level data isolation.
- Dashboard calculations.
- Unauthorized access handling.

### Run All Backend Tests

```bash
npm run test:all
```

The complete backend test suite was verified with:

- Authentication tests: 53 passed.
- Product and multi-tenant tests: 30 passed.
- **Total: 83 tests passed.**

## 11. Security Implementation

The application includes the following security measures:

- **Password Hashing:** User passwords are hashed using bcryptjs before being stored.
- **JWT Authentication:** Protected API requests require valid authentication tokens.
- **Input Validation:** User and product inputs are validated before processing.
- **Parameterized Queries:** Database operations use parameterized queries to reduce SQL injection risks.
- **Tenant Isolation:** Product operations are scoped to the authenticated organization.
- **Environment Variables:** Sensitive configuration is maintained outside tracked source code.

## 12. Current MVP Scope

The current implementation focuses on the core inventory management workflow:

- Authentication and organization creation.
- Multi-tenant inventory access.
- Product CRUD operations.
- Inventory dashboard.
- Low-stock identification.
- Backend testing.

Features such as multi-warehouse management, product variants, purchase orders, order management, external integrations, notifications, role-based access control, audit logs, and billing are outside the current MVP scope.

## 13. Future Improvements

Possible future enhancements include:

- Inventory import and export.
- Stock movement history.
- Advanced inventory analytics and reports.
- Role-based access control.
- Audit logs.
- Automated low-stock notifications.
- Multi-warehouse inventory support.

## 14. Author

Developed as a full-stack internship assessment project.

**Project:** StockFlow – Multi-Tenant Inventory Management MVP

**Repository:** https://github.com/Srilekha0629/stockflow-inventory-mvp

**Live Application:** https://stockflow-inventory-mvp-1-6kl7.onrender.com

**Backend API Health:** https://stockflow-inventory-mvp-229y.onrender.com/api/health

**Deployment Platform:** Render

---

**StockFlow – One workspace. Multiple organizations. Separate inventories.**
