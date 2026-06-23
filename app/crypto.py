"""Symmetric encryption for secrets stored at rest (API keys, SMTP password).

Uses Fernet (AES-128-CBC + HMAC). The key comes from APP_ENCRYPTION_KEY if set
(a urlsafe-base64 32-byte Fernet key); otherwise it is derived deterministically
from JWT_SECRET_KEY so encryption is always on as long as that secret is set.

decrypt() is backward-compatible: if a stored value isn't a valid token (i.e.
legacy plaintext written before encryption was added), it is returned as-is.
"""

import base64
import functools
import hashlib
import os

from cryptography.fernet import Fernet, InvalidToken


@functools.lru_cache(maxsize=1)
def _fernet() -> Fernet:
    explicit = os.getenv("APP_ENCRYPTION_KEY", "").strip()
    if explicit:
        return Fernet(explicit.encode())
    secret = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
    derived = base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest())
    return Fernet(derived)


def encrypt(value: str | None) -> str | None:
    if not value:
        return value
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str | None) -> str | None:
    if not value:
        return value
    try:
        return _fernet().decrypt(value.encode()).decode()
    except (InvalidToken, ValueError):
        # Legacy plaintext written before encryption was introduced.
        return value
