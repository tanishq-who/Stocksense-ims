# StockSense Backend

StockSense Inventory Management System (IMS) backend service built with **FastAPI**, **SQLAlchemy**, **SQLite**, and **Pydantic**.

## Architecture & Features

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) for high-performance async REST APIs.
- **ORM / Database**: [SQLAlchemy](https://www.sqlalchemy.org/) with persistent local [SQLite](https://www.sqlite.org/).
- **Validation & Serialization**: [Pydantic v2](https://docs.pydantic.dev/) schemas with clear, descriptive validation errors.
- **CORS enabled**: Pre-configured to allow frontend integration.
- **Transactional Stock Operations**: Atomic updates across stock balances and an immutable audit ledger for Receipts, Deliveries, and Internal Transfers.
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
   - `location_type`: Zone type (`internal`, `receiving`, `dispatch`)
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
   - `reference`: Unique sequential code (e.g. `REC-00001`, `DEL-00001`, `TRF-00001`)
   - `operation_type`: Operation type (`receipt`, `delivery`, `transfer`)
   - `status`: Lifecycle state (`draft`, `done`, `cancelled`)
   - `supplier`: Supplier name (for receipts)
   - `customer`: Customer / contact name (for deliveries)
   - `source_location_id`: Foreign key to `locations.id` (source for deliveries and transfers)
   - `destination_location_id`: Foreign key to `locations.id` (destination for receipts and transfers)
   - `scheduled_date`: Delivery or transfer scheduled date
   - `created_at` / `updated_at`: Timestamps

6. **`OperationLine`**:
   - `id`: Primary key
   - `operation_id`: Foreign key to `operations.id`
   - `product_id`: Foreign key to `products.id`
   - `quantity`: Moved quantity (> 0)

7. **`StockLedgerEntry`**:
   - `id`: Primary key
   - `product_id`: Foreign key to `products.id`
   - `location_id`: Foreign key to `locations.id`
   - `operation_id`: Foreign key to `operations.id`
   - `operation_reference`: Operation reference string (e.g. `REC-00001`, `DEL-00001`, `TRF-00001`)
   - `delta`: Stock change delta (positive for receipts, negative for deliveries, dual positive/negative for transfers)
   - `balance_after`: Resulting stock level at location
   - `timestamp`: UTC timestamp of the transaction

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

### Inventory Operations (Receipts, Deliveries, and Transfers)

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
    - Repeated validation is rejected with HTTP 400.

#### Operations Querying & Ledger
- **`GET /operations`**: List operations. Supports filtering by `status` (e.g. `draft`, `done`) and `operation_type` (e.g. `receipt`, `delivery`, `transfer`).
- **`GET /operations/{id}`**: Retrieve single operation by ID.
- **`GET /ledger`**: List immutable audit trail entries. Supports filtering by `product_id`, `location_id`, and `operation_reference`.

### Product Management APIs
- **`GET /products`**: List all products (supports `search`, `category`, pagination).
- **`POST /products`**: Create a product (validates `name`, `sku` uniqueness, `unit_of_measure`, `reorder_level >= 0`).
- **`GET /products/{id}`**: Retrieve single product.
- **`PATCH /products/{id}`**: Partially update product.

### Warehouses, Locations & Stock Levels
- **Warehouses**: `POST /api/warehouses`, `GET /api/warehouses`, `GET /api/warehouses/{id}`
- **Locations**: `POST /api/locations`, `GET /api/locations`, `GET /api/locations/{id}`
- **Stock Levels**: `POST /api/stock-levels`, `GET /api/stock-levels`, `GET /api/stock-levels/{id}`
