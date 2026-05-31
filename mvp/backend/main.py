from __future__ import annotations

import json
import os
import secrets
import sqlite3
import time
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, File, HTTPException, Header, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "mvp.sqlite3"
RECIPES_PATH = BASE_DIR / "recipes_seed.json"


def _db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    with _db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL,
              created_at INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
              token TEXT PRIMARY KEY,
              user_id INTEGER NOT NULL,
              created_at INTEGER NOT NULL,
              FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS favorites (
              user_id INTEGER NOT NULL,
              recipe_id TEXT NOT NULL,
              created_at INTEGER NOT NULL,
              PRIMARY KEY(user_id, recipe_id),
              FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )


def _now() -> int:
    return int(time.time())


def _load_recipes() -> list[dict[str, Any]]:
    with open(RECIPES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


RECIPES = _load_recipes()
RECIPE_BY_ID = {r["id"]: r for r in RECIPES}


def _hash_password(password: str) -> str:
    # MVP: basit hash (gerçek projede bcrypt/argon2 kullanın).
    salt = os.environ.get("MVP_PASSWORD_SALT", "dev-salt")
    return f"sha256${salt}$" + __import__("hashlib").sha256((salt + password).encode("utf-8")).hexdigest()


def _verify_password(password: str, hashed: str) -> bool:
    return secrets.compare_digest(_hash_password(password), hashed)


class RegisterIn(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=4, max_length=128)


class LoginIn(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    token: str


class SuggestIn(BaseModel):
    ingredients: list[str] = Field(default_factory=list)


def _norm_ing(s: str) -> str:
    return s.strip().lower()


def _get_user_id_from_token(token: str) -> int:
    with _db() as conn:
        row = conn.execute("SELECT user_id FROM sessions WHERE token = ?", (token,)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(row["user_id"])


def auth_user_id(authorization: str | None = Header(default=None)) -> int:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")
    return _get_user_id_from_token(token)


app = FastAPI(title="Recipes MVP", version="0.1.0")


@app.on_event("startup")
def _startup() -> None:
    _init_db()


frontend_dir = BASE_DIR.parent / "frontend"
app.mount("/static", StaticFiles(directory=frontend_dir, html=False), name="static")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(frontend_dir / "index.html")


@app.post("/auth/register", response_model=TokenOut)
def register(payload: RegisterIn) -> TokenOut:
    email = payload.email.strip().lower()
    with _db() as conn:
        try:
            cur = conn.execute(
                "INSERT INTO users(email, password, created_at) VALUES(?,?,?)",
                (email, _hash_password(payload.password), _now()),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail="Email already registered")
        user_id = int(cur.lastrowid)
        token = secrets.token_urlsafe(32)
        conn.execute(
            "INSERT INTO sessions(token, user_id, created_at) VALUES(?,?,?)",
            (token, user_id, _now()),
        )
        return TokenOut(token=token)


@app.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn) -> TokenOut:
    email = payload.email.strip().lower()
    with _db() as conn:
        row = conn.execute("SELECT id, password FROM users WHERE email = ?", (email,)).fetchone()
        if not row or not _verify_password(payload.password, str(row["password"])):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = secrets.token_urlsafe(32)
        conn.execute(
            "INSERT INTO sessions(token, user_id, created_at) VALUES(?,?,?)",
            (token, int(row["id"]), _now()),
        )
        return TokenOut(token=token)


@app.get("/ingredients")
def ingredients() -> dict[str, list[str]]:
    # MVP: sabit ingredient seti. Sonradan katalog/DB'ye taşınabilir.
    items = sorted(
        {
            "domates",
            "soğan",
            "patates",
            "havuç",
            "yoğurt",
            "sarımsak",
            "yumurta",
            "zeytinyağı",
            "tuz",
            "karabiber",
            "pul biber",
            "kekik",
        }
    )
    return {"items": items}


@app.get("/recipes")
def list_recipes(q: str | None = None) -> dict[str, Any]:
    if not q:
        return {"items": RECIPES}
    needles = {_norm_ing(x) for x in q.split(",") if x.strip()}
    items: list[dict[str, Any]] = []
    for r in RECIPES:
        has = {_norm_ing(x) for x in r.get("ingredients", [])}
        if needles.issubset(has):
            items.append(r)
    return {"items": items}


@app.post("/recipes/suggest")
def suggest(payload: SuggestIn) -> dict[str, Any]:
    selected = {_norm_ing(x) for x in payload.ingredients if x.strip()}
    scored: list[tuple[int, dict[str, Any]]] = []
    for r in RECIPES:
        has = {_norm_ing(x) for x in r.get("ingredients", [])}
        score = len(selected.intersection(has))
        if score > 0:
            scored.append((score, r))
    scored.sort(key=lambda t: (-t[0], t[1]["name"]))
    return {"items": [r for _, r in scored[:10]]}


@app.get("/favorites")
def favorites(user_id: int = Depends(auth_user_id)) -> dict[str, Any]:
    with _db() as conn:
        rows = conn.execute(
            "SELECT recipe_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    items = [RECIPE_BY_ID[r["recipe_id"]] for r in rows if r["recipe_id"] in RECIPE_BY_ID]
    return {"items": items}


@app.post("/favorites/{recipe_id}")
def toggle_favorite(recipe_id: str, user_id: int = Depends(auth_user_id)) -> dict[str, Any]:
    if recipe_id not in RECIPE_BY_ID:
        raise HTTPException(status_code=404, detail="Recipe not found")
    with _db() as conn:
        existing = conn.execute(
            "SELECT 1 FROM favorites WHERE user_id = ? AND recipe_id = ?",
            (user_id, recipe_id),
        ).fetchone()
        if existing:
            conn.execute(
                "DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?",
                (user_id, recipe_id),
            )
            return {"recipe_id": recipe_id, "favorite": False}
        conn.execute(
            "INSERT INTO favorites(user_id, recipe_id, created_at) VALUES(?,?,?)",
            (user_id, recipe_id, _now()),
        )
        return {"recipe_id": recipe_id, "favorite": True}


@app.post("/image/process")
async def image_process(file: UploadFile = File(...)) -> dict[str, Any]:
    # MVP dummy görüntü işleme: filename üzerinden basit eşleşme yapar.
    name = (file.filename or "").lower()
    candidates = ["domates", "soğan", "patates", "havuç"]
    detected = [c for c in candidates if c in name]
    if not detected:
        detected = [secrets.choice(candidates)]
    return {
        "service": "dummy",
        "detected_ingredients": detected,
        "confidence": 0.55,
        "note": "MVP dummy servis (gerçek model daha sonra entegre edilecek).",
    }
