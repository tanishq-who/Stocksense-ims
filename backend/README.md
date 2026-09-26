# StockSense Backend

StockSense Inventory Management System (IMS) backend service built with **FastAPI**, **SQLAlchemy**, **SQLite**, and **Pydantic**.

## Architecture & Features

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) for high-performance async REST APIs.
- **ORM / Database**: [SQLAlchemy](https://www.sqlalchemy.org/) with persistent local [SQLite](https://www.sqlite.org/).
- **Validation & Serialization**: [Pydantic v2](https://docs.pydantic.dev/) schemas with clear, descriptive validation errors.
- **CORS enabled**: Pre-configured to allow frontend integration.
- **Transactional Stock Operations**: Atomic updates across stock balances and an immutable audit ledger for Receipts, Deliveries, Internal Transfers, and Stock Adjustments.
- **Automatic Schema Migration / Initialization**: SQLite tables and columns are automatically initialized and migrated upon startup.

## Data Models

The SQLite database (`stocksense.db`) defines relational models for real-time inventory management:

1. **`Product`**:
   - `id`: Primary key
   - `name`: Product name (required, non-empty)
   - `sku`: Unique SKU identifier (required, unique)
   - `description`: Optional product details
   - `category`: Product category
   - `price`: Unit price (>= 0)
   - `unit_of_measure`: Measurement unit (required, e.g. `pcs`, `kg`)
   - `reorder_level`: Minimum reorder threshold (>= 0, default: 0)
   - `created_at` / `updated_at`: Timestamps

2. **`Warehouse`**:
   - `id`: Primary key
   - `name`: Warehouse name
   - `code`: Unique warehouse code (e.g. `WH-MAIN`)
   - `address`: Physical warehouse address
   - `is_active`: Operational status flag
   - `created_at` / `updated_at`: Timestamps

3. **`Location`**:
   - `id`: Primary key
   - `warehouse_id`: Foreign key to `warehouses.id`
   - `name`: Location identifier (e.g. `Aisle 1 - Shelf B`)
   - `code`: Location code (e.g. `WH1-A1-S1`)
   - `location_type`: Zone type (`internal`, `receiving`, `dispatch`, `storage`)
   - `created_at` / `updated_at`: Timestamps

4. **`StockLevel`**:
   - `id`: Primary key
   - `product_id`: Foreign key to `products.id`
   - `location_id`: Foreign key to `locations.id`
   - `quantity`: Current on-hand quantity
   - `reserved_quantity`: Quantity reserved for pending orders
   - `reorder_threshold`: Threshold for low stock reordering alerts
   - `created_at` / `updated_at`: Timestamps
   - Unique constraint: `(product_id, location_id)`

5. **`Operation`**:
   - `id`: Primary key
   - `reference`: Unique sequential code (e.g. `REC-00001`, `DEL-00001`, `TRF-00001`, `ADJ-00001`)
   - `operation_type`: Operation type (`receipt`, `delivery`, `transfer`, `adjustment`)
   - `status`: Lifecycle state (`draft`, `done`, `cancelled`)
   - `supplier`: Supplier name (for receipts)
   - `customer`: Customer / contact name (for deliveries)
   - `location_id`: Location foreign key (for adjustments)
   - `source_location_id`: Foreign key to `locations.id` (source for deliveries and transfers)
   - `destination_location_id`: Foreign key to `locations.id` (destination for receipts and transfers)
   - `scheduled_date`: Delivery or transfer scheduled date
   - `reason`: Optional reason or audit rationale (e.g. damaged goods, annual stocktake)
   - `created_at` / `updated_at`: Timestamps

6. **`OperationLine`**:
   - `id`: Primary key
   - `operation_id`: Foreign key to `operations.id`
   - `product_id`: Foreign key to `products.id`
   - `quantity`: Moved quantity (> 0 for movements, or physical count)
   - `physical_count`: Counted physical quantity on-hand for adjustments (>= 0)

7. **`StockLedgerEntry`**:
   - `id`: Primary key
   - `product_id`: Foreign key to `products.id`
   - `location_id`: Foreign key to `locations.id`
   - `operation_id`: Foreign key to `operations.id`
   - `operation_reference`: Operation reference string (e.g. `REC-00001`, `DEL-00001`, `TRF-00001`, `ADJ-00001`)
   - `delta`: Stock change delta (positive for receipts, negative for deliveries, dual positive/negative for transfers, calculated `physical_count - current_quantity` for adjustments)
   - `balance_after`: Resulting stock level at location
   - `reason`: Audit reason string copied from the validated operation
   - `timestamp`: UTC timestamp of the transaction

8. **`User`**:
   - `id`: Primary key
   - `name`: User full name
   - `email`: Unique email address (normalized to lowercase)
   - `password_hash`: Secure bcrypt hash (plain passwords never stored)
   - `created_at` / `updated_at`: Timestamps

9. **`PasswordResetOTP`**:
   - `id`: Primary key
   - `user_id`: Foreign key to `users.id` (cascading delete)
   - `code_hash`: Secure bcrypt hash of the 6-digit OTP (plain OTPs never stored in DB)
   - `expires_at`: Expiration timestamp (10 minutes from creation)
   - `used_at`: Timestamp when the OTP was successfully consumed or invalidated
   - `created_at`: Timestamp of generation

---

## Getting Started

Navigate into the `backend/` directory:
```bash
cd backend
```

### 1. Create and Activate Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Server

If `.venv` is activated:
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Direct command on Windows without activating (recommended if "uvicorn is not recognized"):**
```powershell
.\.venv\Scripts\uvicorn.exe main:app --reload --host 127.0.0.1 --port 8000
```
or:
```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The server starts at `http://127.0.0.1:8000`.

---

## API Endpoints

### Health Check
- **`GET /health`**
  - **Response**: `{"status": "ok"}`
  - Used for liveness/readiness probes.

### Interactive Documentation
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Inventory Operations (Receipts, Deliveries, Transfers, and Adjustments)

#### Incoming Receipts
- **`POST /operations/receipts`**: Create a `draft` incoming receipt operation.

#### Delivery Orders
- **`POST /operations/deliveries`**: Create a `draft` delivery order.

#### Internal Transfers
- **`POST /operations/transfers`**
  - Creates a `draft` internal transfer between two distinct locations.
  - Body:
    ```json
    {
      "source_location_id": 1,
      "destination_location_id": 2,
      "scheduled_date": "2026-10-05T14:00:00Z",
      "lines": [
        {
          "product_id": 1,
          "quantity": 10.0
        }
      ]
    }
    ```
  - Validates that source and destination locations are different, both exist, and line quantities are positive.

#### Stock Adjustments
- **`POST /operations/adjustments`**
  - Creates a `draft` stock adjustment for cycle counts, audits, or inventory corrections.
  - Body:
    ```json
    {
      "location_id": 1,
      "lines": [
        {
          "product_id": 1,
          "physical_count": 35.0
        }
      ],
      "reason": "Damaged inventory discovered during aisle 3 audit"
    }
    ```
  - Validates `location_id` and all `product_id`s exist, and requires `physical_count >= 0.0`.
  - Automatically generates unique reference `ADJ-00001`.

#### Operation Validation
- **`POST /operations/{id}/validate`**
  - Validates a `draft` operation in a single atomic database transaction:
    - **For Receipts**: Creates/updates destination `StockLevel`, increases stock, and records positive ledger entry.
    - **For Deliveries**: Pre-checks stock at source. If insufficient, returns detailed `422` with shortage info and modifies nothing; if available, decreases stock and records negative ledger entry.
    - **For Internal Transfers**:
      1. Validates source and destination locations are different.
      2. Checks that all products have sufficient stock at source before changing any data.
      3. If insufficient, returns `422` error and changes nothing.
      4. Decreases source `StockLevel` and increases destination `StockLevel`.
      5. Creates **two** `StockLedgerEntry` records per line: negative source entry and positive destination entry, both with `balance_after`.
      6. Marks operation `done`.
    - **For Stock Adjustments**:
      1. Validates `physical_count >= 0.0`.
      2. Reads current `StockLevel` for each product at the target location.
      3. Computes `delta = physical_count - current_quantity`.
      4. Updates `StockLevel.quantity = physical_count` (or creates `StockLevel` if none existed).
      5. Records immutable `StockLedgerEntry` with `delta`, `physical_count` as `balance_after`, `location_id`, timestamp, operation reference, and audit `reason`.
      6. Supports both negative deltas (shrinkage/damaged goods) and positive deltas (found inventory).
      7. Marks operation `done`.
    - Repeated validation is rejected with HTTP 400.

#### Operations Querying & Ledger
- **`GET /operations`**: List operations. Supports filtering by `status` (e.g. `draft`, `done`) and `operation_type` (e.g. `receipt`, `delivery`, `transfer`, `adjustment`).
- **`GET /operations/{id}`**: Retrieve single operation by ID.
- **`GET /ledger`**: List immutable audit trail entries with balance after and reason. Supports filtering by `product_id`, `location_id`, and `operation_reference`.

### Product Management APIs
- **`GET /products`**: List all products (supports `search`, `category`, pagination).
- **`POST /products`**: Create a product (validates `name`, `sku` uniqueness, `unit_of_measure`, `reorder_level >= 0`).
- **`GET /products/{id}`**: Retrieve single product.
- **`PATCH /products/{id}`**: Partially update product.

### Warehouses, Locations & Stock Levels
- **Warehouses**: `POST /api/warehouses`, `GET /api/warehouses`, `GET /api/warehouses/{id}`
- **Locations**: `POST /api/locations`, `GET /api/locations`, `GET /api/locations/{id}`
- **Stock Levels**: `POST /api/stock-levels`, `GET /api/stock-levels`, `GET /api/stock-levels/{id}`

### Dashboard & Inventory Alerts

#### Dashboard Overview
- **`GET /dashboard`** (also available at `GET /api/dashboard`)
  - Aggregates real-time, SQLite-backed inventory KPI metrics and recent operations.
  - **Optional Query Filters**:
    - `operation_type`: Filter operations by type (`receipt`, `delivery`, `transfer`, `adjustment`)
    - `status`: Filter operations by status (`draft`, `done`, `cancelled`)
    - `warehouse_id`: Filter stock metrics and operations by warehouse ID
    - `location_id`: Filter stock metrics and operations by location ID
    - `category`: Filter products, stock metrics, and operations by category
  - **Response Fields**:
    - `total_products_in_stock`: Count of products with available quantity > 0
    - `low_stock_count`: Number of items where `0 < available_quantity <= reorder_level`
    - `out_of_stock_count`: Count of products where available quantity == 0
    - `pending_receipts_count`: Number of pending (draft) receipts
    - `pending_deliveries_count`: Number of pending (draft) deliveries
    - `scheduled_transfers_count`: Number of scheduled (draft) transfers
    - `low_stock_products`: Detailed list of low-stock items with `product_name`, `sku`, `available_quantity`, `reorder_level`, and `location`
    - `recent_operations`: List of recent operations matching filters
  - Returns useful empty states (0 counts and empty arrays `[]`) when no data matches.

#### Low-Stock & Out-of-Stock Alerts
- **`GET /alerts/low-stock`** (also available at `GET /api/alerts/low-stock`)
  - Provides active threshold alerts based on real database stock levels:
    - **Low Stock**: `available_quantity > 0 and available_quantity <= reorder_level`
    - **Out of Stock**: `available_quantity == 0`
  - **Optional Query Filters**:
    - `warehouse_id`: Filter alerts by warehouse ID
    - `location_id`: Filter alerts by location ID
    - `category`: Filter alerts by product category
    - `status`: Alert status filter: `'low_stock'` (default), `'out_of_stock'`, or `'all'`
    - `skip`: Pagination offset (default: 0)
    - `limit`: Pagination limit (default: 100, max: 500)
  - Returns a list of alert items or an empty list `[]` when no alerts exist.

### Authentication & Account Security

All authentication operations use salted **bcrypt** password/OTP hashing and standards-compliant **JWT** Bearer tokens.

#### Endpoints
- **`POST /auth/signup`**:
  - Registers a new user.
  - Body: `{"name": "...", "email": "...", "password": "..."}`
  - Password rules: minimum 8 characters, at least 1 uppercase (A-Z), 1 lowercase (a-z), and 1 digit (0-9).
  - Enforces email uniqueness across registered accounts.
- **`POST /auth/login`**:
  - Authenticates user credentials.
  - Body: `{"email": "...", "password": "..."}`
  - Returns: `{"access_token": "<jwt>", "token_type": "bearer", "user": {...}}`
- **`GET /auth/me`**:
  - Retrieves current authenticated user profile.
  - Header: `Authorization: Bearer <jwt_access_token>`
  - Returns `401 Unauthorized` if token is missing, expired, or invalid.
- **`POST /auth/password-reset/request`**:
  - Generates a cryptographically secure 6-digit OTP.
  - Automatically invalidates any earlier unused OTPs for the user.
  - Stores only the bcrypt hash of the OTP with a 10-minute expiration.
  - In development mode (`DEBUG=true`), returns the development OTP in the response for hackathon testing.
- **`POST /auth/password-reset/verify`**:
  - Body: `{"email": "...", "otp": "123456", "new_password": "..."}`
  - Rejects expired, incorrect, or previously consumed OTPs with `400 Bad Request`.
  - Updates the user's password securely with bcrypt and marks the OTP as used.

