# StockSense Backend

StockSense Inventory Management System (IMS) backend service built with **FastAPI**, **SQLAlchemy**, **SQLite**, and **Pydantic**.

## Architecture & Features

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) for high-performance async REST APIs.
- **ORM / Database**: [SQLAlchemy](https://www.sqlalchemy.org/) with persistent local [SQLite](https://www.sqlite.org/).
- **Validation & Serialization**: [Pydantic v2](https://docs.pydantic.dev/) schemas with clear, descriptive validation errors.
- **CORS enabled**: Pre-configured to allow frontend integration.
- **Transactional Stock Operations**: Atomic updates across stock balances and an immutable audit ledger for both Receipts and Deliveries.
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
   - `reference`: Unique sequential code (e.g. `REC-00001`, `DEL-00001`)
   - `operation_type`: Operation type (`receipt`, `delivery`)
   - `status`: Lifecycle state (`draft`, `done`, `cancelled`)
   - `supplier`: Supplier name (for receipts)
   - `customer`: Customer / contact name (for deliveries)
   - `source_location_id`: Foreign key to `locations.id` (source for deliveries)
   - `destination_location_id`: Foreign key to `locations.id` (destination for receipts)
   - `scheduled_date`: Delivery scheduled date
   - `created_at` / `updated_at`: Timestamps

6. **`OperationLine`**:
   - `id`: Primary key
   - `operation_id`: Foreign key to `operations.id`
   - `product_id`: Foreign key to `products.id`
   - `quantity`: Received or delivered quantity (> 0)

7. **`StockLedgerEntry`**:
   - `id`: Primary key
   - `product_id`: Foreign key to `products.id`
   - `location_id`: Foreign key to `locations.id`
   - `operation_id`: Foreign key to `operations.id`
   - `operation_reference`: Operation reference string (e.g. `REC-00001`, `DEL-00001`)
   - `delta`: Stock change delta (positive for receipts, negative for deliveries)
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

### Inventory Operations (Receipts & Deliveries)

#### Incoming Receipts
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

#### Delivery Orders
- **`POST /operations/deliveries`**
  - Creates a `draft` delivery order.
  - Body:
    ```json
    {
      "customer": "Customer Name",
      "source_location_id": 1,
      "scheduled_date": "2026-10-01T10:00:00Z",
      "lines": [
        {
          "product_id": 1,
          "quantity": 25.0
        }
      ]
    }
    ```

#### Operation Validation
- **`POST /operations/{id}/validate`**
  - Validates a `draft` receipt or delivery in a single atomic database transaction:
    - **For Receipts**:
      1. Creates or updates `StockLevel` at the destination location.
      2. Increases stock quantity.
      3. Creates immutable `StockLedgerEntry` with positive `delta` and `balance_after`.
      4. Marks receipt `done`.
    - **For Deliveries**:
      1. Pre-checks stock availability across all lines before changing any stock.
      2. If insufficient stock, returns a detailed `422 Unprocessable Content` response listing each product, requested quantity, available quantity, and shortage. No data is changed.
      3. If stock is available, decreases `StockLevel` at the source location.
      4. Creates immutable `StockLedgerEntry` with negative `delta` and `balance_after`.
      5. Marks delivery `done`.
    - Rejects validating an already `done` operation with HTTP 400.

#### Operations Querying & Ledger
- **`GET /operations`**
  - Lists operations with optional filtering by `status` (e.g. `draft`, `done`) and `operation_type` (e.g. `receipt`, `delivery`).
- **`GET /operations/{id}`**
  - Retrieves a single operation with all lines and location details.
- **`GET /ledger`**
  - Lists immutable stock ledger audit records with filters: `product_id`, `location_id`, `operation_reference`.

### Product Management APIs
- **`GET /products`**: List all products (supports `search`, `category`, pagination).
- **`POST /products`**: Create a product (validates `name`, `sku` uniqueness, `unit_of_measure`, `reorder_level >= 0`).
- **`GET /products/{id}`**: Retrieve single product.
- **`PATCH /products/{id}`**: Partially update product.

### Warehouses, Locations & Stock Levels
- **Warehouses**: `POST /api/warehouses`, `GET /api/warehouses`, `GET /api/warehouses/{id}`
- **Locations**: `POST /api/locations`, `GET /api/locations`, `GET /api/locations/{id}`
- **Stock Levels**: `POST /api/stock-levels`, `GET /api/stock-levels`, `GET /api/stock-levels/{id}`
