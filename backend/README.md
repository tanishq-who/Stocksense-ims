# StockSense Backend

StockSense Inventory Management System (IMS) backend service built with **FastAPI**, **SQLAlchemy**, **SQLite**, and **Pydantic**.

## Architecture & Features

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) for high-performance async REST APIs.
- **ORM / Database**: [SQLAlchemy](https://www.sqlalchemy.org/) with persistent local [SQLite](https://www.sqlite.org/).
- **Validation & Serialization**: [Pydantic v2](https://docs.pydantic.dev/) schemas with clear, descriptive validation errors.
- **CORS enabled**: Pre-configured to allow frontend integration.
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

### Product Management APIs
- **`GET /products`**
  - List all products.
  - Supports optional query parameters: `search` (name/SKU/description), `category`, `skip`, `limit`.
- **`POST /products`**
  - Create a new product.
  - Validates required `name`, required unique `sku`, required `unit_of_measure`, and `reorder_level >= 0`.
  - Returns HTTP 400 Bad Request with descriptive message if SKU already exists.
  - Returns HTTP 422 Unprocessable Entity with clear error details if validation fails.
- **`GET /products/{id}`**
  - Retrieve a single product by its ID.
  - Returns HTTP 404 Not Found if product does not exist.
- **`PATCH /products/{id}`**
  - Partially update a product.
  - Validates uniqueness if SKU is modified, `reorder_level >= 0`, and non-empty strings.
  - Returns HTTP 404 Not Found if product does not exist.

### Warehouses, Locations & Stock Levels
- **Warehouses**:
  - `POST /api/warehouses`: Create a warehouse
  - `GET /api/warehouses`: List warehouses
  - `GET /api/warehouses/{warehouse_id}`: Retrieve a warehouse
- **Locations**:
  - `POST /api/locations`: Create a location within a warehouse
  - `GET /api/locations`: List locations (optionally filter by `warehouse_id`)
  - `GET /api/locations/{location_id}`: Retrieve a location
- **Stock Levels**:
  - `POST /api/stock-levels`: Record stock levels
  - `GET /api/stock-levels`: List stock levels (optionally filter by `product_id` or `location_id`)
  - `GET /api/stock-levels/{stock_id}`: Retrieve stock level details
