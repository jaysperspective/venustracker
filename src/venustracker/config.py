"""Paths, constants, and per-source cache TTLs."""

import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Directories
# ---------------------------------------------------------------------------

HOME = Path.home()
DATA_DIR = HOME / ".venustracker"
CACHE_DIR = DATA_DIR / "cache"

DATA_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Cache TTLs (seconds)
# ---------------------------------------------------------------------------

TTL_HORIZONS = int(os.getenv("TTL_HORIZONS", 3_600))      # 1 hour
TTL_VIZIER = int(os.getenv("TTL_VIZIER", 86_400))        # 24 hours
TTL_COBS = int(os.getenv("TTL_COBS", 1_800))             # 30 min
TTL_DSS = int(os.getenv("TTL_DSS", 7 * 86_400))          # 7 days

# ---------------------------------------------------------------------------
# JPL Horizons
# ---------------------------------------------------------------------------

VENUS_ID = "299"              # JPL body ID for Venus
SUN_ID = "10"

# ---------------------------------------------------------------------------
# Default observer (used when no lat/lon is supplied)
# ---------------------------------------------------------------------------

DEFAULT_LAT = 0.0             # Equator / Greenwich
DEFAULT_LON = 0.0

# ---------------------------------------------------------------------------
# COBS REST  (endpoint: https://cobs.si/api/obs_list.api)
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# DSS / SkyView
# ---------------------------------------------------------------------------

DSS_SURVEYS = ["DSS", "DSS2 Red", "DSS2 Blue"]
DEFAULT_DSS_SURVEY = "DSS2 Red"
DEFAULT_FOV_DEG = 0.5
