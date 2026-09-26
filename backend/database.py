import os
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB_FILE = BASE_DIR / "stocksense.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_FILE.as_posix()}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that yields an active database session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes all database tables registered in SQLAlchemy models and migrates schema if needed."""
    import models  # noqa: F401 - ensure models are registered on Base.metadata
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        # Migrate products columns if needed
        result = conn.execute(text("PRAGMA table_info(products)"))
        prod_columns = [row[1] for row in result.fetchall()]
        if prod_columns and "reorder_level" not in prod_columns:
            conn.execute(text("ALTER TABLE products ADD COLUMN reorder_level FLOAT NOT NULL DEFAULT 0.0"))

        # Migrate operations columns if needed
        result = conn.execute(text("PRAGMA table_info(operations)"))
        op_columns = [row[1] for row in result.fetchall()]
        if op_columns:
            if "customer" not in op_columns:
                conn.execute(text("ALTER TABLE operations ADD COLUMN customer VARCHAR"))
            if "source_location_id" not in op_columns:
                conn.execute(text("ALTER TABLE operations ADD COLUMN source_location_id INTEGER"))
            if "scheduled_date" not in op_columns:
                conn.execute(text("ALTER TABLE operations ADD COLUMN scheduled_date DATETIME"))
            if "location_id" not in op_columns:
                conn.execute(text("ALTER TABLE operations ADD COLUMN location_id INTEGER"))
            if "reason" not in op_columns:
                conn.execute(text("ALTER TABLE operations ADD COLUMN reason VARCHAR"))

        # Migrate operation_lines columns if needed
        result = conn.execute(text("PRAGMA table_info(operation_lines)"))
        line_columns = [row[1] for row in result.fetchall()]
        if line_columns and "physical_count" not in line_columns:
            conn.execute(text("ALTER TABLE operation_lines ADD COLUMN physical_count FLOAT"))

        # Migrate stock_ledger_entries columns if needed
        result = conn.execute(text("PRAGMA table_info(stock_ledger_entries)"))
        ledger_columns = [row[1] for row in result.fetchall()]
        if ledger_columns and "reason" not in ledger_columns:
            conn.execute(text("ALTER TABLE stock_ledger_entries ADD COLUMN reason VARCHAR"))

        # Ensure unique index for location name within warehouse
        try:
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_location_warehouse_name ON locations (warehouse_id, name)"))
        except Exception:
            pass

        conn.commit()
