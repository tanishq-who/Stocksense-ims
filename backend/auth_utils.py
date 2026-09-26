import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import jwt

# JWT configuration - defaults to a secure dev key, customizable via environment variable
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "stocksense-secure-dev-jwt-key-2026-hackathon")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def hash_password(password: str) -> str:
    """Hash plain-text password securely using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain-text password against stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def hash_otp(otp_code: str) -> str:
    """Hash OTP securely using bcrypt so plain-text OTP is never stored in DB."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(otp_code.encode("utf-8"), salt).decode("utf-8")


def verify_otp(plain_otp: str, hashed_otp: str) -> bool:
    """Verify plain-text OTP against stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_otp.encode("utf-8"), hashed_otp.encode("utf-8"))
    except Exception:
        return False


def generate_6digit_otp() -> str:
    """Generate a cryptographically secure 6-digit numeric OTP."""
    code = secrets.randbelow(900000) + 100000
    return f"{code:06d}"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    expire = now_utc + (expires_delta or timedelta(hours=JWT_EXPIRATION_HOURS))
    to_encode.update({"exp": expire, "iat": now_utc})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify signed JWT access token."""
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])


def validate_email_str(value: str) -> str:
    """Validate email format, strip whitespace, and normalize to lowercase."""
    if not value or not value.strip():
        raise ValueError("Email is required and cannot be empty.")
    v = value.strip().lower()
    if not EMAIL_REGEX.match(v):
        raise ValueError("Invalid email format. Please provide a valid email address.")
    return v


def validate_password_strength(value: str) -> str:
    """
    Validate password strength requirements:
    - Minimum 8 characters
    - At least one uppercase letter (A-Z)
    - At least one lowercase letter (a-z)
    - At least one numeric digit (0-9)
    """
    if not value:
        raise ValueError("Password is required.")
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", value):
        raise ValueError("Password must contain at least one uppercase letter (A-Z).")
    if not re.search(r"[a-z]", value):
        raise ValueError("Password must contain at least one lowercase letter (a-z).")
    if not re.search(r"\d", value):
        raise ValueError("Password must contain at least one numeric digit (0-9).")
    return value
