"""Email/password auth: SQLite + bcrypt, mounted at ``/auth``."""

from __future__ import annotations

import logging
import re
import sqlite3
from pathlib import Path

import bcrypt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

_DB_PATH = Path(__file__).resolve().parents[2] / "storage" / "email_auth.sqlite3"

router = APIRouter()


class AuthPayload(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=256)


def _get_conn() -> sqlite3.Connection:
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_auth_db() -> None:
    conn = _get_conn()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                email TEXT UNIQUE,
                password_hash TEXT
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def _normalize_email(email: str) -> str:
    return str(email or "").strip().lower()


def _validate_email(email: str) -> str:
    em = _normalize_email(email)
    if not em or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", em):
        raise ValueError("valid email required")
    return em


def _validate_password(password: str) -> str:
    pw = str(password or "")
    if len(pw) < 8:
        raise ValueError("password must be at least 8 characters")
    return pw


def register_user(email: str, password: str) -> dict[str, str]:
    init_auth_db()
    em = _validate_email(email)
    pw = _validate_password(password)
    hashed = bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    conn = _get_conn()
    try:
        cur = conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (em, hashed),
        )
        conn.commit()
        uid = int(cur.lastrowid)
        return {"user_id": str(uid), "email": em}
    except sqlite3.IntegrityError as e:
        raise ValueError("email already registered") from e
    finally:
        conn.close()


def login_user(email: str, password: str) -> dict[str, str] | None:
    init_auth_db()
    em = _validate_email(email)
    pw = str(password or "")
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
            (em,),
        ).fetchone()
        if not row:
            return None
        stored_hash = str(row["password_hash"] or "")
        if not stored_hash:
            return None
        if not bcrypt.checkpw(pw.encode("utf-8"), stored_hash.encode("utf-8")):
            return None
        return {"user_id": str(int(row["id"])), "email": str(row["email"])}
    finally:
        conn.close()


@router.post("/register")
def auth_register(payload: AuthPayload) -> dict[str, str]:
    try:
        return register_user(payload.email, payload.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("register failed")
        raise HTTPException(status_code=503, detail="failed to register user") from e


@router.post("/login")
def auth_login(payload: AuthPayload) -> dict[str, str]:
    try:
        user = login_user(payload.email, payload.password)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("login failed")
        raise HTTPException(status_code=503, detail="failed to login") from e
