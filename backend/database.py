"""SQLite database for community observation log."""

from __future__ import annotations

import json
import logging
import os
import sqlite3
from pathlib import Path

log = logging.getLogger(__name__)

_DB_PATH = os.getenv("DB_PATH", str(Path.home() / ".venustracker" / "observations.db"))
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", str(Path.home() / ".venustracker" / "uploads")))
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Max constraints
MAX_IMAGES_PER_OBS = 1
MAX_IMAGE_BYTES = 2 * 1024 * 1024  # 2 MB per image (base64-decoded)
MAX_NOTE_LENGTH = 2000
MAX_NAME_LENGTH = 40
MAX_POSTS_PER_DEVICE_PER_DAY = 10


def _get_conn() -> sqlite3.Connection:
    Path(_DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    conn = _get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS observations (
            id            TEXT PRIMARY KEY,
            device_id     TEXT NOT NULL,
            display_name  TEXT DEFAULT '',
            timestamp     TEXT NOT NULL,
            notes         TEXT DEFAULT '',
            condition     TEXT DEFAULT '',
            rating        INTEGER DEFAULT 0,
            naked_eye     INTEGER DEFAULT 1,
            images        TEXT DEFAULT '[]',
            venus_data    TEXT DEFAULT '{}',
            approved      INTEGER DEFAULT 0,
            created_at    TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_obs_created ON observations(created_at DESC)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_obs_device ON observations(device_id)
    """)
    # Migrate: add approved column if missing (existing DBs)
    try:
        conn.execute("ALTER TABLE observations ADD COLUMN approved INTEGER DEFAULT 0")
        conn.commit()
        log.info("Migrated: added 'approved' column")
    except sqlite3.OperationalError:
        pass  # column already exists
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_obs_approved ON observations(approved)
    """)
    conn.commit()
    conn.close()
    log.info("Database initialized at %s", _DB_PATH)


def device_post_count_today(device_id: str) -> int:
    """Count how many posts a device has made today (UTC)."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT COUNT(*) FROM observations WHERE device_id = ? AND created_at >= date('now')",
        (device_id,),
    ).fetchone()
    conn.close()
    return row[0]


def create_observation(
    obs_id: str,
    device_id: str,
    display_name: str,
    timestamp: str,
    notes: str,
    condition: str,
    rating: int,
    naked_eye: bool,
    image_filenames: list[str],
    venus_data: dict,
) -> dict:
    conn = _get_conn()
    conn.execute(
        """INSERT INTO observations
           (id, device_id, display_name, timestamp, notes, condition, rating,
            naked_eye, images, venus_data, approved)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)""",
        (
            obs_id,
            device_id,
            display_name[:MAX_NAME_LENGTH],
            timestamp,
            notes[:MAX_NOTE_LENGTH],
            condition,
            max(0, min(5, rating)),
            1 if naked_eye else 0,
            json.dumps(image_filenames[:MAX_IMAGES_PER_OBS]),
            json.dumps(venus_data),
        ),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM observations WHERE id = ?", (obs_id,)).fetchone()
    conn.close()
    return _row_to_dict(row)


def list_observations(
    limit: int = 50,
    offset: int = 0,
    device_id: str | None = None,
    approved_only: bool = True,
) -> list[dict]:
    conn = _get_conn()
    if device_id:
        # User's own posts — show all regardless of approval status
        rows = conn.execute(
            "SELECT * FROM observations WHERE device_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (device_id, limit, offset),
        ).fetchall()
    elif approved_only:
        rows = conn.execute(
            "SELECT * FROM observations WHERE approved = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
    else:
        # Admin: all posts
        rows = conn.execute(
            "SELECT * FROM observations ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def list_pending(limit: int = 50, offset: int = 0) -> list[dict]:
    """Return observations awaiting approval."""
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM observations WHERE approved = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (limit, offset),
    ).fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def count_pending() -> int:
    conn = _get_conn()
    row = conn.execute("SELECT COUNT(*) FROM observations WHERE approved = 0").fetchone()
    conn.close()
    return row[0]


def count_observations(device_id: str | None = None, approved_only: bool = True) -> int:
    conn = _get_conn()
    if device_id:
        row = conn.execute(
            "SELECT COUNT(*) FROM observations WHERE device_id = ?", (device_id,)
        ).fetchone()
    elif approved_only:
        row = conn.execute(
            "SELECT COUNT(*) FROM observations WHERE approved = 1"
        ).fetchone()
    else:
        row = conn.execute("SELECT COUNT(*) FROM observations").fetchone()
    conn.close()
    return row[0]


def approve_observation(obs_id: str) -> bool:
    conn = _get_conn()
    cur = conn.execute("UPDATE observations SET approved = 1 WHERE id = ?", (obs_id,))
    conn.commit()
    conn.close()
    return cur.rowcount > 0


def reject_observation(obs_id: str) -> bool:
    """Reject = delete the observation and its images."""
    return admin_delete_observation(obs_id)


def delete_observation(obs_id: str, device_id: str) -> bool:
    """Delete an observation only if it belongs to the given device_id."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT images FROM observations WHERE id = ? AND device_id = ?",
        (obs_id, device_id),
    ).fetchone()
    if not row:
        conn.close()
        return False

    _cleanup_images(row["images"])

    conn.execute(
        "DELETE FROM observations WHERE id = ? AND device_id = ?",
        (obs_id, device_id),
    )
    conn.commit()
    conn.close()
    return True


def admin_delete_observation(obs_id: str) -> bool:
    """Admin delete — no device_id check."""
    conn = _get_conn()
    row = conn.execute("SELECT images FROM observations WHERE id = ?", (obs_id,)).fetchone()
    if not row:
        conn.close()
        return False

    _cleanup_images(row["images"])

    conn.execute("DELETE FROM observations WHERE id = ?", (obs_id,))
    conn.commit()
    conn.close()
    return True


def _cleanup_images(images_json: str) -> None:
    try:
        filenames = json.loads(images_json)
        for fname in filenames:
            path = UPLOADS_DIR / fname
            if path.exists():
                path.unlink()
    except Exception as exc:
        log.warning("Failed to clean up images: %s", exc)


def _row_to_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    d["images"] = json.loads(d.get("images", "[]"))
    d["venus_data"] = json.loads(d.get("venus_data", "{}"))
    d["naked_eye"] = bool(d.get("naked_eye", 1))
    d["approved"] = bool(d.get("approved", 0))
    return d
