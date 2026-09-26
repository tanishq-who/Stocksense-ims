import uuid
import sys
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_warehouse_and_location_management():
    print("--- 1. Testing Warehouse Creation & Validation ---")
    
    # 1.1 Empty name validation
    res = client.post("/warehouses", json={"name": ""})
    assert res.status_code == 422, f"Expected 422 on empty warehouse name, got {res.status_code}: {res.text}"
    print("  PASS: Empty warehouse name rejected with 422.")

    # 1.2 Whitespace name validation
    res = client.post("/warehouses", json={"name": "   "})
    assert res.status_code == 422, f"Expected 422 on whitespace warehouse name, got {res.status_code}: {res.text}"
    print("  PASS: Whitespace warehouse name rejected with 422.")

    # 1.3 Successful warehouse creation
    wh1_name = f"North Hub {uuid.uuid4().hex[:6]}"
    wh1_code = f"NH-{uuid.uuid4().hex[:4].upper()}"
    res = client.post("/warehouses", json={
        "name": wh1_name,
        "code": wh1_code,
        "address": "100 Logistics Way, Industrial Park",
        "is_active": True
    })
    assert res.status_code == 201, f"Failed to create warehouse: {res.text}"
    wh1 = res.json()
    wh1_id = wh1["id"]
    assert wh1["name"] == wh1_name
    assert wh1["code"] == wh1_code
    assert wh1["locations_count"] == 0
    print(f"  PASS: Warehouse '{wh1_name}' created with ID {wh1_id}.")

    # 1.4 Auto-generated code if not provided
    wh2_name = f"South Hub {uuid.uuid4().hex[:6]}"
    res = client.post("/warehouses", json={"name": wh2_name})
    assert res.status_code == 201, f"Failed to create warehouse with auto-code: {res.text}"
    wh2 = res.json()
    wh2_id = wh2["id"]
    assert wh2["code"].startswith("WH-")
    print(f"  PASS: Warehouse '{wh2_name}' created with auto-code '{wh2['code']}'.")

    # 1.5 Duplicate warehouse name check (case-insensitive)
    res = client.post("/warehouses", json={"name": wh1_name.lower()})
    assert res.status_code == 400, f"Expected 400 on duplicate warehouse name, got {res.status_code}: {res.text}"
    assert "already exists" in res.json()["detail"]
    print("  PASS: Duplicate warehouse name rejected with 400.")

    print("\n--- 2. Testing Warehouse Listing & Retrieval ---")
    res = client.get("/warehouses")
    assert res.status_code == 200
    all_whs = res.json()
    assert any(w["id"] == wh1_id for w in all_whs)
    print(f"  PASS: GET /warehouses listed {len(all_whs)} warehouses.")

    res = client.get(f"/warehouses/{wh1_id}")
    assert res.status_code == 200
    assert res.json()["id"] == wh1_id
    print(f"  PASS: GET /warehouses/{wh1_id} retrieved successfully.")

    res = client.get("/warehouses/999999")
    assert res.status_code == 404
    print("  PASS: Non-existent warehouse returns 404.")

    print("\n--- 3. Testing Warehouse Patch / Update ---")
    # 3.1 Update address & status
    res = client.patch(f"/warehouses/{wh1_id}", json={
        "address": "200 New Logistics Blvd",
        "is_active": False
    })
    assert res.status_code == 200
    patched_wh1 = res.json()
    assert patched_wh1["address"] == "200 New Logistics Blvd"
    assert patched_wh1["is_active"] is False
    print("  PASS: PATCH /warehouses/{id} updated address and active state.")

    # 3.2 Try to rename wh1 to wh2's name -> should 400
    res = client.patch(f"/warehouses/{wh1_id}", json={"name": wh2_name})
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]
    print("  PASS: Rename to existing warehouse name rejected with 400.")

    # 3.3 404 on patching non-existent warehouse
    res = client.patch("/warehouses/999999", json={"name": "Ghost Warehouse"})
    assert res.status_code == 404
    print("  PASS: PATCH /warehouses/999999 returned 404.")

    print("\n--- 4. Testing Location Creation & Validation ---")
    # 4.1 Missing/empty location name -> 422
    res = client.post("/locations", json={"warehouse_id": wh1_id, "name": ""})
    assert res.status_code == 422
    print("  PASS: Empty location name rejected with 422.")

    # 4.2 Non-existent warehouse -> 404
    res = client.post("/locations", json={"warehouse_id": 999999, "name": "Zone A"})
    assert res.status_code == 404
    assert "Warehouse with ID 999999 not found" in res.json()["detail"]
    print("  PASS: Location creation for non-existent warehouse returned 404.")

    # 4.3 Create valid location in wh1
    loc1_name = f"Aisle-A-{uuid.uuid4().hex[:4]}"
    res = client.post("/locations", json={
        "warehouse_id": wh1_id,
        "name": loc1_name,
        "code": "A1-01",
        "location_type": "internal"
    })
    assert res.status_code == 201, f"Failed to create location: {res.text}"
    loc1 = res.json()
    loc1_id = loc1["id"]
    assert loc1["name"] == loc1_name
    assert loc1["warehouse_id"] == wh1_id
    assert loc1["total_quantity"] == 0.0
    assert loc1["products_in_stock_count"] == 0
    assert loc1["stock_summary"]["total_quantity"] == 0.0
    print(f"  PASS: Location '{loc1_name}' created in Warehouse {wh1_id} with stock summary 0.")

    # 4.4 Duplicate location name in SAME warehouse -> 400
    res = client.post("/locations", json={
        "warehouse_id": wh1_id,
        "name": loc1_name.lower(),
    })
    assert res.status_code == 400
    assert "already exists in warehouse" in res.json()["detail"]
    print("  PASS: Duplicate location name in same warehouse rejected with 400.")

    # 4.5 Same location name in DIFFERENT warehouse -> ALLOWED
    res = client.post("/locations", json={
        "warehouse_id": wh2_id,
        "name": loc1_name,
    })
    assert res.status_code == 201, f"Expected same name in different warehouse to succeed, got: {res.text}"
    loc_wh2 = res.json()
    assert loc_wh2["warehouse_id"] == wh2_id
    assert loc_wh2["name"] == loc1_name
    print(f"  PASS: Same location name '{loc1_name}' allowed in different warehouse {wh2_id}.")

    # 4.6 Create a second location in wh1
    loc2_name = f"Aisle-B-{uuid.uuid4().hex[:4]}"
    res = client.post("/locations", json={
        "warehouse_id": wh1_id,
        "name": loc2_name,
    })
    assert res.status_code == 201
    loc2_id = res.json()["id"]

    print("\n--- 5. Testing GET /warehouses/{id}/locations ---")
    # 5.1 Non-existent warehouse -> 404
    res = client.get("/warehouses/999999/locations")
    assert res.status_code == 404
    print("  PASS: GET /warehouses/999999/locations returned 404.")

    # 5.2 Get locations for wh1
    res = client.get(f"/warehouses/{wh1_id}/locations")
    assert res.status_code == 200
    wh1_locs = res.json()
    assert len(wh1_locs) == 2
    assert any(l["id"] == loc1_id for l in wh1_locs)
    assert any(l["id"] == loc2_id for l in wh1_locs)
    for l in wh1_locs:
        assert "total_quantity" in l
        assert "products_in_stock_count" in l
        assert "stock_summary" in l
    print(f"  PASS: GET /warehouses/{wh1_id}/locations returned 2 locations with stock summaries.")

    # 5.3 Verify warehouse locations_count is updated
    res = client.get(f"/warehouses/{wh1_id}")
    assert res.status_code == 200
    assert res.json()["locations_count"] == 2
    print("  PASS: Warehouse locations_count dynamically reports 2.")

    print("\n--- 6. Testing Location Patch / Update ---")
    # 6.1 Non-existent location -> 404
    res = client.patch("/locations/999999", json={"name": "Shelf 99"})
    assert res.status_code == 404
    print("  PASS: PATCH /locations/999999 returned 404.")

    # 6.2 Move to non-existent warehouse -> 404
    res = client.patch(f"/locations/{loc1_id}", json={"warehouse_id": 999999})
    assert res.status_code == 404
    print("  PASS: Move location to non-existent warehouse returned 404.")

    # 6.3 Rename loc1 to loc2's name in same warehouse -> 400
    res = client.patch(f"/locations/{loc1_id}", json={"name": loc2_name})
    assert res.status_code == 400
    assert "already exists in warehouse" in res.json()["detail"]
    print("  PASS: Renaming location to existing name in same warehouse rejected with 400.")

    # 6.4 Successful update of loc1
    updated_loc1_name = f"{loc1_name}-renamed"
    res = client.patch(f"/locations/{loc1_id}", json={
        "name": updated_loc1_name,
        "location_type": "storage"
    })
    assert res.status_code == 200
    assert res.json()["name"] == updated_loc1_name
    assert res.json()["location_type"] == "storage"
    print("  PASS: Location successfully patched.")

    print("\n--- 7. Testing Stock Summary Calculation with Real Stock Levels ---")
    # Create 2 test products
    prod1_sku = f"SKU-{uuid.uuid4().hex[:6].upper()}"
    prod1_res = client.post("/products", json={
        "name": "Industrial Bolts",
        "sku": prod1_sku,
        "price": 10.0,
        "unit_of_measure": "box",
        "reorder_level": 5.0
    })
    assert prod1_res.status_code == 201
    prod1_id = prod1_res.json()["id"]

    prod2_sku = f"SKU-{uuid.uuid4().hex[:6].upper()}"
    prod2_res = client.post("/products", json={
        "name": "Industrial Nuts",
        "sku": prod2_sku,
        "price": 8.0,
        "unit_of_measure": "box",
        "reorder_level": 5.0
    })
    assert prod2_res.status_code == 201
    prod2_id = prod2_res.json()["id"]

    # Ingest stock via receipt into loc1
    rec_res = client.post("/operations/receipts", json={
        "supplier": "Fastener Supply Co",
        "destination_location_id": loc1_id,
        "lines": [
            {"product_id": prod1_id, "quantity": 50.0},
            {"product_id": prod2_id, "quantity": 30.0},
        ]
    })
    assert rec_res.status_code == 201
    rec_id = rec_res.json()["id"]

    # Validate receipt to commit stock
    val_res = client.post(f"/operations/{rec_id}/validate")
    assert val_res.status_code == 200
    assert val_res.json()["status"] == "done"

    # Now verify loc1 stock summary:
    # total_quantity = 50.0 + 30.0 = 80.0
    # products_in_stock_count = 2
    res = client.get(f"/locations/{loc1_id}")
    assert res.status_code == 200
    loc1_data = res.json()
    assert loc1_data["total_quantity"] == 80.0, f"Expected 80.0, got {loc1_data['total_quantity']}"
    assert loc1_data["products_in_stock_count"] == 2, f"Expected 2, got {loc1_data['products_in_stock_count']}"
    assert loc1_data["stock_summary"]["total_quantity"] == 80.0
    assert loc1_data["stock_summary"]["products_in_stock_count"] == 2
    assert loc1_data["stock_summary"]["total_products"] == 2
    print(f"  PASS: GET /locations/{loc1_id} dynamic stock summary: total_quantity=80.0, products_in_stock_count=2.")

    # Also verify stock summary appears on GET /warehouses/{wh1_id}/locations
    res = client.get(f"/warehouses/{wh1_id}/locations")
    assert res.status_code == 200
    wh1_loc_summary = [l for l in res.json() if l["id"] == loc1_id][0]
    assert wh1_loc_summary["total_quantity"] == 80.0
    assert wh1_loc_summary["products_in_stock_count"] == 2
    print("  PASS: GET /warehouses/{id}/locations reports accurate stock summary for locations.")

    # Also verify stock summary on PATCH /locations/{loc1_id}
    res = client.patch(f"/locations/{loc1_id}", json={"code": "UPDATED-LOC"})
    assert res.status_code == 200
    patched_loc = res.json()
    assert patched_loc["total_quantity"] == 80.0
    assert patched_loc["products_in_stock_count"] == 2
    print("  PASS: PATCH /locations/{id} returns updated stock summary.")

    print("\nALL WAREHOUSE & LOCATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_warehouse_and_location_management()
