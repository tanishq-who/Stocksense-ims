import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from main import app, init_db, get_db
import models
from auth_utils import verify_password, verify_otp, create_access_token

init_db()
client = TestClient(app)

def run_tests():
    print("=== 1. Verify Health Check ===")
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
    print("Health check OK!")

    print("\n=== 2. Verify OpenAPI Documentation for Auth Endpoints ===")
    openapi = client.get("/openapi.json").json()
    paths = openapi["paths"]
    assert "/auth/signup" in paths, "POST /auth/signup missing from OpenAPI"
    assert "/auth/login" in paths, "POST /auth/login missing from OpenAPI"
    assert "/auth/me" in paths, "GET /auth/me missing from OpenAPI"
    assert "/auth/password-reset/request" in paths, "POST /auth/password-reset/request missing from OpenAPI"
    assert "/auth/password-reset/verify" in paths, "POST /auth/password-reset/verify missing from OpenAPI"
    print("All auth endpoints registered in OpenAPI specification!")

    run_id = uuid.uuid4().hex[:8]
    test_email = f"alice_{run_id}@example.com"
    test_password = "SecurePassword123"
    test_name = "Alice Smith"

    print("\n=== 3. Test Signup Validation (Email & Password Strength) ===")
    # 3a. Invalid email format
    res_bad_email = client.post("/auth/signup", json={
        "name": test_name,
        "email": "not-an-email",
        "password": test_password
    })
    assert res_bad_email.status_code == 422, f"Expected 422 for bad email, got {res_bad_email.status_code}"
    print("Rejected invalid email with 422 as expected!")

    # 3b. Weak password - less than 8 chars
    res_short_pwd = client.post("/auth/signup", json={
        "name": test_name,
        "email": test_email,
        "password": "Short1"
    })
    assert res_short_pwd.status_code == 422
    print("Rejected short password (<8 chars) with 422 as expected!")

    # 3c. Weak password - no uppercase
    res_no_upper = client.post("/auth/signup", json={
        "name": test_name,
        "email": test_email,
        "password": "lowercaseonly123"
    })
    assert res_no_upper.status_code == 422
    print("Rejected password without uppercase letter with 422 as expected!")

    # 3d. Weak password - no digit
    res_no_digit = client.post("/auth/signup", json={
        "name": test_name,
        "email": test_email,
        "password": "NoDigitsInPassword"
    })
    assert res_no_digit.status_code == 422
    print("Rejected password without digit with 422 as expected!")

    # 3e. Successful signup
    signup_res = client.post("/auth/signup", json={
        "name": test_name,
        "email": test_email,
        "password": test_password
    })
    assert signup_res.status_code == 201, f"Signup failed: {signup_res.text}"
    user_data = signup_res.json()
    user_id = user_data["id"]
    assert user_data["name"] == test_name
    assert user_data["email"] == test_email.lower()
    assert "password" not in user_data
    assert "password_hash" not in user_data
    print(f"Created User #{user_id} ('{test_name}', '{test_email}') successfully!")

    # 3f. Verify database storage: password_hash is stored, NOT plain password
    db_gen = get_db()
    db = next(db_gen)
    user_in_db = db.query(models.User).filter(models.User.id == user_id).first()
    assert user_in_db.password_hash != test_password, "Plain-text password was stored in DB!"
    assert verify_password(test_password, user_in_db.password_hash), "Password hash verification failed!"
    print("Verified: Password is encrypted with bcrypt in the database (never stored in plain text)!")

    # 3g. Duplicate email rejected
    dup_res = client.post("/auth/signup", json={
        "name": "Alice Duplicate",
        "email": test_email.upper(),  # case-insensitive check
        "password": test_password
    })
    assert dup_res.status_code == 400, f"Expected 400 for duplicate email, got {dup_res.status_code}"
    print("Rejected duplicate email with 400 as expected!")

    print("\n=== 4. Test Login & JWT Token Generation ===")
    # 4a. Wrong password
    wrong_pwd_res = client.post("/auth/login", json={
        "email": test_email,
        "password": "WrongPassword123"
    })
    assert wrong_pwd_res.status_code == 401, f"Expected 401 for wrong password, got {wrong_pwd_res.status_code}"
    print("Rejected invalid password with 401 as expected!")

    # 4b. Non-existent email
    non_existent_res = client.post("/auth/login", json={
        "email": "ghost@example.com",
        "password": test_password
    })
    assert non_existent_res.status_code == 401
    print("Rejected non-existent email with 401 as expected!")

    # 4c. Successful login
    login_res = client.post("/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["token_type"] == "bearer"
    assert login_data["user"]["id"] == user_id
    token = login_data["access_token"]
    print("Login successful! Received valid JWT access token.")

    print("\n=== 5. Test Authenticated Profile (GET /auth/me) ===")
    # 5a. Access with valid token
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200, f"GET /auth/me failed: {me_res.text}"
    me_data = me_res.json()
    assert me_data["id"] == user_id
    assert me_data["name"] == test_name
    assert me_data["email"] == test_email.lower()
    print("GET /auth/me authenticated successfully!")

    # 5b. Access without token
    no_token_res = client.get("/auth/me")
    assert no_token_res.status_code == 401
    print("GET /auth/me without token rejected with 401 as expected!")

    # 5c. Access with invalid token
    bad_token_res = client.get("/auth/me", headers={"Authorization": "Bearer invalid.garbage.token"})
    assert bad_token_res.status_code == 401
    print("GET /auth/me with invalid token rejected with 401 as expected!")

    print("\n=== 6. Test Password Reset Request (POST /auth/password-reset/request) ===")
    # 6a. Non-existent email
    res_unknown = client.post("/auth/password-reset/request", json={"email": "nobody@example.com"})
    assert res_unknown.status_code == 404
    print("Password reset request for unknown email rejected with 404!")

    # 6b. Valid email request
    reset_req_res = client.post("/auth/password-reset/request", json={"email": test_email})
    assert reset_req_res.status_code == 200, reset_req_res.text
    reset_data = reset_req_res.json()
    assert reset_data["expires_in_minutes"] == 10
    otp_code = reset_data.get("otp") or reset_data.get("dev_otp")
    assert otp_code is not None, "Development OTP was not returned in response"
    assert len(otp_code) == 6 and otp_code.isdigit(), f"Expected 6-digit numeric OTP, got '{otp_code}'"
    print(f"Password reset request generated OTP '{otp_code}' (expires in 10 minutes)")

    # 6c. Verify DB stores ONLY bcrypt hash of OTP, never plain-text
    otp_in_db = db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.user_id == user_id,
        models.PasswordResetOTP.used_at.is_(None)
    ).order_by(models.PasswordResetOTP.id.desc()).first()
    assert otp_in_db is not None
    assert otp_in_db.code_hash != otp_code, "Plain-text OTP was stored in DB!"
    assert verify_otp(otp_code, otp_in_db.code_hash), "OTP hash verification failed!"
    print("Verified: OTP is hashed with bcrypt in the database (never stored in plain text)!")

    # 6d. Invalidation of earlier unused OTPs on new request
    reset_req_res2 = client.post("/auth/password-reset/request", json={"email": test_email})
    assert reset_req_res2.status_code == 200
    otp_code2 = reset_req_res2.json()["otp"]
    # Check that first OTP was marked used/invalidated
    db.refresh(otp_in_db)
    assert otp_in_db.used_at is not None, "Earlier OTP was not invalidated!"
    print("Verified: Requesting a new OTP automatically invalidates earlier unused OTPs!")

    print("\n=== 7. Test Password Reset Verify (POST /auth/password-reset/verify) ===")
    new_password = "BrandNewPassword2026"

    # 7a. Incorrect OTP
    res_wrong_otp = client.post("/auth/password-reset/verify", json={
        "email": test_email,
        "otp": "000000",
        "new_password": new_password
    })
    assert res_wrong_otp.status_code == 400
    print("Rejected incorrect OTP with 400 as expected!")

    # 7b. Weak new_password
    res_weak_new = client.post("/auth/password-reset/verify", json={
        "email": test_email,
        "otp": otp_code2,
        "new_password": "weak"
    })
    assert res_weak_new.status_code == 422
    print("Rejected weak new password with 422 as expected!")

    # 7c. Successful password reset
    res_success_reset = client.post("/auth/password-reset/verify", json={
        "email": test_email,
        "otp": otp_code2,
        "new_password": new_password
    })
    assert res_success_reset.status_code == 200, res_success_reset.text
    print("Password reset verified successfully!")

    # 7d. Reject reused OTP
    res_reused = client.post("/auth/password-reset/verify", json={
        "email": test_email,
        "otp": otp_code2,
        "new_password": "AnotherPassword2026"
    })
    assert res_reused.status_code == 400
    print("Rejected reused OTP with 400 as expected!")

    # 7e. Old password fails login
    old_login = client.post("/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert old_login.status_code == 401
    print("Verified: Old password no longer works!")

    # 7f. New password succeeds login
    new_login = client.post("/auth/login", json={
        "email": test_email,
        "password": new_password
    })
    assert new_login.status_code == 200
    new_token = new_login.json()["access_token"]
    assert new_token is not None

    # Check /auth/me with new token
    me_new = client.get("/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert me_new.status_code == 200
    assert me_new.json()["id"] == user_id
    print("Verified: Logged in successfully with new password and retrieved authenticated profile!")

    print("\n=== 8. Test Expired OTP Rejection ===")
    # Generate an expired OTP directly in DB
    from auth_utils import hash_otp
    expired_code = "999888"
    expired_record = models.PasswordResetOTP(
        user_id=user_id,
        code_hash=hash_otp(expired_code),
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=5),  # expired 5 mins ago
        used_at=None,
        created_at=datetime.now(timezone.utc) - timedelta(minutes=15),
    )
    db.add(expired_record)
    db.commit()

    res_expired = client.post("/auth/password-reset/verify", json={
        "email": test_email,
        "otp": expired_code,
        "new_password": "YetAnotherPassword2026"
    })
    assert res_expired.status_code == 400
    print("Verified: Expired OTP rejected with 400 as expected!")

    print("\n=== ALL AUTH TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
