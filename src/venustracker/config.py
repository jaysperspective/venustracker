"""Paths, constants, and per-source cache TTLs."""

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

TTL_HORIZONS = 3_600          # 1 hour  — ephemerides change slowly
TTL_VIZIER = 86_400           # 24 hours — star catalogues are static
TTL_COBS = 1_800              # 30 min  — comet obs updated frequently
TTL_DSS = 7 * 86_400          # 7 days  — DSS images never change

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
