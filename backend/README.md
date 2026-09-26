# StockSense Backend

StockSense Inventory Management System (IMS) backend service built with **FastAPI**, **SQLAlchemy**, **SQLite**, and **Pydantic**.

## Architecture & Features

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) for high-performance async REST APIs.
- **ORM / Database**: [SQLAlchemy](https://www.sqlalchemy.org/) with persistent local [SQLite](https://www.sqlite.org/).
- **Validation & Serialization**: [Pydantic v2](https://docs.pydantic.dev/) schemas with clear, descriptive validation errors.
- **CORS enabled**: Pre-configured to allow frontend integration.
- **Transactional Stock Operations**: Atomic updates across stock balances and an immutable audit ledger.
- **Automatic Schema Migration / Initialization**: SQLite tables are automatically initialized and migrated upon startup.

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
   - `reference`: Unique sequential code (e.g. `REC-00001`)
   - `operation_type`: Operation type (`receipt`, etc.)
   - `status`: Lifecycle state (`draft`, `done`, `cancelled`)
   - `supplier`: Supplier name
   - `destination_location_id`: Foreign key to `locations.id`
   - `created_at` / `updated_at`: Timestamps

6. **`OperationLine`**:
   - `id`: Primary key
   - `operation_id`: Foreign key to `operations.id`
   - `product_id`: Foreign key to `products.id`
   - `quantity`: Received quantity (> 0)

7. **`StockLedgerEntry`**:
   - `id`: Primary key
   - `product_id`: Foreign key to `products.id`
   - `location_id`: Foreign key to `locations.id`
   - `operation_id`: Foreign key to `operations.id`
   - `operation_reference`: Operation reference string (e.g. `REC-00001`)
   - `delta`: Stock change delta (positive for receipts)
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

### Incoming Receipt Operations
- **`POST /operations/receipts`**
  - Creates a `draft` receipt operation.
  - Body:
    ```json
    {
      "supplier": "Acme Supplies",
      "destination_location_id": 1,
      "lines": [
        {
          "product_id": 1,
          "quantity": 100.0
        }
      ]
    }
    ```
  - Validates non-empty supplier, valid destination location, valid products, and positive quantities.
- **`POST /operations/{id}/validate`**
  - Validates a `draft` receipt atomically:
    1. Creates or updates `StockLevel` for every product at the destination location.
    2. Increases stock quantity by the received amount.
    3. Records an immutable `StockLedgerEntry` with positive delta, timestamp, operation reference, location, and `balance_after`.
    4. Marks the receipt status as `done`.
    5. Rejects validation with HTTP 400 if already validated.
- **`GET /operations`**
  - Lists operations. Supports filtering by `status` (e.g. `draft`, `done`) and `operation_type` (e.g. `receipt`).
- **`GET /operations/{id}`**
  - Retrieves a single operation with all line items.
- **`GET /ledger`**
  - Lists immutable stock ledger audit records. Supports filtering by `product_id`, `location_id`, and `operation_reference`.

### Product Management APIs
- **`GET /products`**: List all products (supports `search`, `category`, pagination).
- **`POST /products`**: Create a product (validates `name`, `sku` uniqueness, `unit_of_measure`, `reorder_level >= 0`).
- **`GET /products/{id}`**: Retrieve single product.
- **`PATCH /products/{id}`**: Partially update product.

### Warehouses, Locations & Stock Levels
- **Warehouses**: `POST /api/warehouses`, `GET /api/warehouses`, `GET /api/warehouses/{id}`
- **Locations**: `POST /api/locations`, `GET /api/locations`, `GET /api/locations/{id}`
- **Stock Levels**: `POST /api/stock-levels`, `GET /api/stock-levels`, `GET /api/stock-levels/{id}`
