import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from main import app, init_db

init_db()
client = TestClient(app)

def run_tests():
    print("=== 1. Health check ===")
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
    print("Health check OK!")

    print("\n=== 2. Check OpenAPI Docs for Dashboard & Alerts ===")
    openapi = client.get("/openapi.json").json()
    paths = openapi["paths"]
    assert "/dashboard" in paths, "GET /dashboard not in OpenAPI spec"
    assert "/alerts/low-stock" in paths, "GET /alerts/low-stock not in OpenAPI spec"
    print("Endpoints successfully registered in OpenAPI specification!")

    print("\n=== 3. Setup Test Warehouse and Locations ===")
    import uuid
    ts = uuid.uuid4().hex[:8]
    wh_res = client.post("/api/warehouses", json={
        "name": f"Dashboard Test WH {ts}",
        "code": f"WH-DASH-{ts}",
        "address": "404 Analytics Blvd"
    })
    assert wh_res.status_code == 201, wh_res.text
    wh_id = wh_res.json()["id"]

    loc1_res = client.post("/api/locations", json={
        "warehouse_id": wh_id,
        "name": f"Rack Alpha {ts}",
        "code": f"RACK-A-{ts}",
        "location_type": "storage"
    })
    assert loc1_res.status_code == 201, loc1_res.text
    loc1_id = loc1_res.json()["id"]
    loc1_name = loc1_res.json()["name"]

    loc2_res = client.post("/api/locations", json={
        "warehouse_id": wh_id,
        "name": f"Rack Beta {ts}",
        "code": f"RACK-B-{ts}",
        "location_type": "storage"
    })
    assert loc2_res.status_code == 201, loc2_res.text
    loc2_id = loc2_res.json()["id"]

    print(f"Created Warehouse #{wh_id}, Location 1 #{loc1_id}, Location 2 #{loc2_id}")

    print("\n=== 4. Test Empty States ===")
    empty_dash = client.get(f"/dashboard?warehouse_id={wh_id}").json()
    assert empty_dash["total_products_in_stock"] == 0
    assert empty_dash["low_stock_count"] == 0
    assert empty_dash["out_of_stock_count"] == 0
    assert empty_dash["pending_receipts_count"] == 0
    assert empty_dash["pending_deliveries_count"] == 0
    assert empty_dash["scheduled_transfers_count"] == 0
    assert empty_dash["low_stock_products"] == []
    assert empty_dash["recent_operations"] == []
    print("Warehouse empty state verified successfully!")

    empty_alerts = client.get(f"/alerts/low-stock?warehouse_id={wh_id}").json()
    assert empty_alerts == []
    print("Alerts empty state verified successfully!")

    print("\n=== 5. Create Test Product with reorder_level = 20.0 ===")
    category_name = f"Hardware-{ts}"
    prod_res = client.post("/products", json={
        "name": "Heavy Duty Sprocket",
        "sku": f"SPROCKET-{ts}",
        "category": category_name,
        "price": 18.00,
        "unit_of_measure": "pcs",
        "reorder_level": 20.0
    })
    assert prod_res.status_code == 201, prod_res.text
    product = prod_res.json()
    prod_id = product["id"]
    prod_name = product["name"]
    prod_sku = product["sku"]

    # At this point, product has 0 stock -> it is OUT OF STOCK, NOT low stock
    dash_init = client.get(f"/dashboard?category={category_name}").json()
    assert dash_init["total_products_in_stock"] == 0
    assert dash_init["out_of_stock_count"] == 1
    assert dash_init["low_stock_count"] == 0
    assert dash_init["low_stock_products"] == []
    print(f"Initial 0-stock verified: out_of_stock_count=1, low_stock_count=0 (0 is out of stock, not low stock)")

    # Alerts with default status='low_stock' should NOT return it (since qty == 0)
    alerts_low = client.get(f"/alerts/low-stock?category={category_name}").json()
    assert alerts_low == []
    print("Verified GET /alerts/low-stock does not include 0-stock products (default is low stock only)")

    # Alerts with status='out_of_stock' SHOULD return it
    alerts_oos = client.get(f"/alerts/low-stock?category={category_name}&status=out_of_stock").json()
    assert len(alerts_oos) == 1
    assert alerts_oos[0]["product_id"] == prod_id
    assert alerts_oos[0]["available_quantity"] == 0.0
    assert alerts_oos[0]["status"] == "out_of_stock"
    print("Verified GET /alerts/low-stock?status=out_of_stock returns out of stock item")

    print("\n=== 6. Ingest Stock into Low-Stock Range (15 units <= reorder_level 20) ===")
    rec_res = client.post("/operations/receipts", json={
        "supplier": "Industrial Sprockets Inc.",
        "destination_location_id": loc1_id,
        "lines": [{"product_id": prod_id, "quantity": 15.0}]
    })
    assert rec_res.status_code == 201
    rec_id = rec_res.json()["id"]

    # Before validation, check pending_receipts_count
    dash_pending = client.get(f"/dashboard?category={category_name}").json()
    assert dash_pending["pending_receipts_count"] == 1
    print(f"Pending receipts count = {dash_pending['pending_receipts_count']}")

    # Validate receipt
    val_res = client.post(f"/operations/{rec_id}/validate")
    assert val_res.status_code == 200

    # Now stock is 15.0 (0 < 15 <= 20) -> PRODUCT IS LOW STOCK!
    dash_low = client.get(f"/dashboard?category={category_name}").json()
    assert dash_low["total_products_in_stock"] == 1
    assert dash_low["out_of_stock_count"] == 0
    assert dash_low["low_stock_count"] == 1
    assert len(dash_low["low_stock_products"]) == 1

    item = dash_low["low_stock_products"][0]
    assert item["product_name"] == prod_name
    assert item["sku"] == prod_sku
    assert item["available_quantity"] == 15.0
    assert item["reorder_level"] == 20.0
    assert item["location"] == loc1_name
    assert item["status"] == "low_stock"
    print(f"Verified Low Stock in GET /dashboard: '{item['product_name']}', available: {item['available_quantity']}, reorder_level: {item['reorder_level']}, location: '{item['location']}'")

    # Check GET /alerts/low-stock
    alerts_active = client.get(f"/alerts/low-stock?category={category_name}").json()
    assert len(alerts_active) == 1
    assert alerts_active[0]["product_id"] == prod_id
    assert alerts_active[0]["product_name"] == prod_name
    assert alerts_active[0]["sku"] == prod_sku
    assert alerts_active[0]["available_quantity"] == 15.0
    assert alerts_active[0]["reorder_level"] == 20.0
    assert alerts_active[0]["location"] == loc1_name
    assert alerts_active[0]["status"] == "low_stock"
    print(f"Verified GET /alerts/low-stock returns active low-stock item successfully!")

    print("\n=== 7. Ingest Additional Stock Above reorder_level (15 + 15 = 30 > 20) ===")
    rec2_res = client.post("/operations/receipts", json={
        "supplier": "Industrial Sprockets Inc.",
        "destination_location_id": loc1_id,
        "lines": [{"product_id": prod_id, "quantity": 15.0}]
    })
    client.post(f"/operations/{rec2_res.json()['id']}/validate")

    dash_normal = client.get(f"/dashboard?category={category_name}").json()
    assert dash_normal["total_products_in_stock"] == 1
    assert dash_normal["out_of_stock_count"] == 0
    assert dash_normal["low_stock_count"] == 0
    assert dash_normal["low_stock_products"] == []
    print("Verified: When available quantity (30) > reorder_level (20), product is NO LONGER low stock!")

    alerts_empty_now = client.get(f"/alerts/low-stock?category={category_name}").json()
    assert alerts_empty_now == []
    print("Verified GET /alerts/low-stock is empty when stock is above reorder_level!")

    print("\n=== 8. Deliver Stock Back into Low-Stock Range (30 - 22 = 8 <= 20) ===")
    del_res = client.post("/operations/deliveries", json={
        "customer": "Apex Manufacturing",
        "source_location_id": loc1_id,
        "lines": [{"product_id": prod_id, "quantity": 22.0}]
    })
    client.post(f"/operations/{del_res.json()['id']}/validate")

    dash_low2 = client.get(f"/dashboard?category={category_name}").json()
    assert dash_low2["low_stock_count"] == 1
    assert dash_low2["low_stock_products"][0]["available_quantity"] == 8.0
    print(f"Verified stock re-entering low-stock range (8 units <= 20): low_stock_count=1")

    print("\n=== 9. Deliver All Stock Down to 0 (8 - 8 = 0) -> Out of Stock ===")
    del2_res = client.post("/operations/deliveries", json={
        "customer": "Apex Manufacturing",
        "source_location_id": loc1_id,
        "lines": [{"product_id": prod_id, "quantity": 8.0}]
    })
    client.post(f"/operations/{del2_res.json()['id']}/validate")

    dash_zero = client.get(f"/dashboard?category={category_name}").json()
    assert dash_zero["total_products_in_stock"] == 0
    assert dash_zero["out_of_stock_count"] == 1
    assert dash_zero["low_stock_count"] == 0
    assert dash_zero["low_stock_products"] == []
    print("Verified: When quantity drops to 0, product is OUT OF STOCK (not low stock)!")

    print("\n=== 10. Test Pending and Scheduled Operations Filters in /dashboard ===")
    # Create draft transfer
    trf_res = client.post("/operations/transfers", json={
        "source_location_id": loc1_id,
        "destination_location_id": loc2_id,
        "lines": [{"product_id": prod_id, "quantity": 5.0}]
    })
    assert trf_res.status_code == 201

    # Check dashboard transfers count
    dash_ops = client.get(f"/dashboard?warehouse_id={wh_id}").json()
    assert dash_ops["scheduled_transfers_count"] == 1
    assert len(dash_ops["recent_operations"]) >= 1
    print("Scheduled transfers count and recent operations verified!")

    # Filter dashboard by operation_type='transfer'
    dash_trf_only = client.get(f"/dashboard?warehouse_id={wh_id}&operation_type=transfer").json()
    assert dash_trf_only["scheduled_transfers_count"] == 1
    assert dash_trf_only["pending_receipts_count"] == 0
    assert dash_trf_only["pending_deliveries_count"] == 0
    print("operation_type filter verified!")

    # Filter dashboard by status='done'
    dash_done = client.get(f"/dashboard?warehouse_id={wh_id}&status=done").json()
    assert dash_done["scheduled_transfers_count"] == 0
    assert all(op["status"] == "done" for op in dash_done["recent_operations"])
    print("status=done filter verified!")

    print("\n=== 11. Test Location and Category Filters on /alerts/low-stock ===")
    alerts_cat = client.get(f"/alerts/low-stock?category={category_name}&status=all").json()
    assert len(alerts_cat) >= 1
    assert all(a["category"] == category_name for a in alerts_cat)

    alerts_loc = client.get(f"/alerts/low-stock?location_id={loc1_id}&status=all").json()
    assert isinstance(alerts_loc, list)
    print("Alert filters verified successfully!")

    print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
