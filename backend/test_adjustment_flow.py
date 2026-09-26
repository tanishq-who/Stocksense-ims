import sys
import uuid
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from main import app, init_db, get_db
import models

# Ensure DB schema is up-to-date with migrations
init_db()

client = TestClient(app)

def run_tests():
    print("=== 1. Verify Health ===")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    assert res.json() == {"status": "ok"}
    print("Health check OK!")

    print("\n=== 2. Setup Test Data (Product, Warehouse, Location) ===")
    # Create product
    run_id = uuid.uuid4().hex[:8]
    prod_sku = f"TEST-ADJ-{run_id}"
    prod_res = client.post("/products", json={
        "name": "Adjustable Widget",
        "sku": prod_sku,
        "description": "Widget for testing stock adjustments",
        "category": "Electronics",
        "price": 25.50,
        "unit_of_measure": "units",
        "reorder_level": 15.0
    })
    assert prod_res.status_code == 201, f"Failed to create product: {prod_res.text}"
    product = prod_res.json()
    prod_id = product["id"]
    print(f"Created Product #{prod_id} (SKU: {prod_sku})")

    # Create warehouse and location
    wh_code = f"WH-ADJ-{run_id}"
    wh_res = client.post("/api/warehouses", json={
        "name": f"Adjustment Warehouse {run_id}",
        "code": wh_code,
        "address": "100 Quality Control Rd"
    })
    assert wh_res.status_code == 201, f"Failed to create warehouse: {wh_res.text}"
    warehouse = wh_res.json()
    wh_id = warehouse["id"]

    loc_res = client.post("/api/locations", json={
        "warehouse_id": wh_id,
        "name": f"Main Storage Bay A {run_id}",
        "code": f"BAY-A-{run_id}",
        "location_type": "storage"
    })
    assert loc_res.status_code == 201, f"Failed to create location: {loc_res.text}"
    location = loc_res.json()
    loc_id = location["id"]
    print(f"Created Warehouse #{wh_id}, Location #{loc_id}")

    print("\n=== 3. Ingest Initial Stock via Receipt (Initial quantity = 50) ===")
    receipt_res = client.post("/operations/receipts", json={
        "supplier": "Acme Widgets Co.",
        "destination_location_id": loc_id,
        "lines": [{"product_id": prod_id, "quantity": 50.0}]
    })
    assert receipt_res.status_code == 201, f"Receipt create failed: {receipt_res.text}"
    receipt_id = receipt_res.json()["id"]

    val_receipt = client.post(f"/operations/{receipt_id}/validate")
    assert val_receipt.status_code == 200, f"Receipt validation failed: {val_receipt.text}"

    # Check stock level
    stock_levels = client.get(f"/api/stock-levels?product_id={prod_id}&location_id={loc_id}").json()
    assert len(stock_levels) >= 1
    assert stock_levels[0]["quantity"] == 50.0
    print(f"Initial StockLevel verified: {stock_levels[0]['quantity']} units at Location #{loc_id}")

    print("\n=== 4. Test Validation Rejections on POST /operations/adjustments ===")
    # 4a. Negative physical_count rejected
    neg_res = client.post("/operations/adjustments", json={
        "location_id": loc_id,
        "lines": [{"product_id": prod_id, "physical_count": -5.0}],
        "reason": "Invalid negative count"
    })
    assert neg_res.status_code == 422, f"Expected 422 for negative physical count, got {neg_res.status_code}: {neg_res.text}"
    print("Rejected negative physical_count with 422 as expected!")

    # 4b. Invalid location_id rejected with 404
    inv_loc = client.post("/operations/adjustments", json={
        "location_id": 999999,
        "lines": [{"product_id": prod_id, "physical_count": 10.0}]
    })
    assert inv_loc.status_code == 404
    print("Rejected non-existent location_id with 404 as expected!")

    # 4c. Invalid product_id rejected with 404
    inv_prod = client.post("/operations/adjustments", json={
        "location_id": loc_id,
        "lines": [{"product_id": 999999, "physical_count": 10.0}]
    })
    assert inv_prod.status_code == 404
    print("Rejected non-existent product_id with 404 as expected!")

    print("\n=== 5. Test Damaged Inventory Scenario (Stock Decreases: 50 -> 35, Delta = -15) ===")
    damage_reason = "Damaged inventory discovered during aisle 3 audit"
    adj_create_res = client.post("/operations/adjustments", json={
        "location_id": loc_id,
        "lines": [{"product_id": prod_id, "physical_count": 35.0}],
        "reason": damage_reason
    })
    assert adj_create_res.status_code == 201, f"Adjustment create failed: {adj_create_res.text}"
    adj_data = adj_create_res.json()
    adj_id = adj_data["id"]
    adj_ref = adj_data["reference"]
    assert adj_data["operation_type"] == "adjustment"
    assert adj_data["status"] == "draft"
    assert adj_data["location_id"] == loc_id
    assert adj_data["reason"] == damage_reason
    assert adj_data["lines"][0]["physical_count"] == 35.0
    assert adj_ref.startswith("ADJ-")
    print(f"Created Draft Adjustment #{adj_id} (Ref: {adj_ref})")

    # Validate the damaged inventory adjustment
    val_adj_res = client.post(f"/operations/{adj_id}/validate")
    assert val_adj_res.status_code == 200, f"Adjustment validation failed: {val_adj_res.text}"
    val_data = val_adj_res.json()
    assert val_data["status"] == "done"
    print(f"Adjustment #{adj_id} successfully validated and marked Done!")

    # Verify StockLevel is now 35.0
    stock_levels_after = client.get(f"/api/stock-levels?product_id={prod_id}&location_id={loc_id}").json()
    assert stock_levels_after[0]["quantity"] == 35.0
    print(f"StockLevel updated to physical_count: {stock_levels_after[0]['quantity']} units")

    # Verify StockLedgerEntry
    ledger_entries = client.get(f"/ledger?operation_reference={adj_ref}").json()
    assert len(ledger_entries) == 1, f"Expected 1 ledger entry, found {len(ledger_entries)}"
    entry = ledger_entries[0]
    assert entry["product_id"] == prod_id
    assert entry["location_id"] == loc_id
    assert entry["delta"] == -15.0, f"Expected delta -15.0, got {entry['delta']}"
    assert entry["balance_after"] == 35.0, f"Expected balance_after 35.0, got {entry['balance_after']}"
    assert entry["reason"] == damage_reason, f"Expected reason '{damage_reason}', got '{entry.get('reason')}'"
    print(f"Verified Ledger Entry: delta={entry['delta']}, balance_after={entry['balance_after']}, reason='{entry['reason']}'")

    print("\n=== 6. Test Repeated Validation Rejection ===")
    reval_res = client.post(f"/operations/{adj_id}/validate")
    assert reval_res.status_code == 400, f"Expected 400 for repeated validation, got {reval_res.status_code}"
    print(f"Repeated validation correctly rejected with 400: {reval_res.json()['detail']}")

    print("\n=== 7. Test Positive Stock Adjustment (Stock Increases: 35 -> 48, Delta = +13) ===")
    found_reason = "Found 13 unrecorded units in back storage rack"
    adj_pos_res = client.post("/operations/adjustments", json={
        "location_id": loc_id,
        "lines": [{"product_id": prod_id, "physical_count": 48.0}],
        "reason": found_reason
    })
    assert adj_pos_res.status_code == 201
    pos_adj_id = adj_pos_res.json()["id"]
    pos_ref = adj_pos_res.json()["reference"]

    val_pos_res = client.post(f"/operations/{pos_adj_id}/validate")
    assert val_pos_res.status_code == 200

    # Verify StockLevel is now 48.0
    stock_levels_pos = client.get(f"/api/stock-levels?product_id={prod_id}&location_id={loc_id}").json()
    assert stock_levels_pos[0]["quantity"] == 48.0

    # Verify positive ledger entry
    pos_ledger = client.get(f"/ledger?operation_reference={pos_ref}").json()
    assert len(pos_ledger) == 1
    assert pos_ledger[0]["delta"] == 13.0
    assert pos_ledger[0]["balance_after"] == 48.0
    assert pos_ledger[0]["reason"] == found_reason
    print(f"Verified Positive Ledger Entry: delta={pos_ledger[0]['delta']}, balance_after={pos_ledger[0]['balance_after']}, reason='{pos_ledger[0]['reason']}'")

    print("\n=== 8. Test Zero Delta Adjustment (Stock remains 48 -> 48, Delta = 0.0) ===")
    audit_reason = "Routine cycle count - no discrepancy found"
    adj_zero_res = client.post("/operations/adjustments", json={
        "location_id": loc_id,
        "lines": [{"product_id": prod_id, "physical_count": 48.0}],
        "reason": audit_reason
    })
    zero_adj_id = adj_zero_res.json()["id"]
    zero_ref = adj_zero_res.json()["reference"]
    val_zero_res = client.post(f"/operations/{zero_adj_id}/validate")
    assert val_zero_res.status_code == 200

    zero_ledger = client.get(f"/ledger?operation_reference={zero_ref}").json()
    assert len(zero_ledger) == 1
    assert zero_ledger[0]["delta"] == 0.0
    assert zero_ledger[0]["balance_after"] == 48.0
    print(f"Verified Zero Delta Ledger Entry: delta={zero_ledger[0]['delta']}, balance_after={zero_ledger[0]['balance_after']}")

    print("\n=== 9. Verify GET /operations filters ===")
    adj_ops = client.get("/operations?operation_type=adjustment").json()
    assert len(adj_ops) >= 3
    assert all(op["operation_type"] == "adjustment" for op in adj_ops)
    print(f"Verified GET /operations?operation_type=adjustment returns {len(adj_ops)} adjustment operations!")

    print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
