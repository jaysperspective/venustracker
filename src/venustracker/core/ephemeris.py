"""General body ephemeris — wraps the Horizons feed with convenience functions."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Optional

import pandas as pd
from astropy.time import Time

from venustracker.feeds.horizons import get_ephemeris
from venustracker.config import DEFAULT_LAT, DEFAULT_LON

log = logging.getLogger(__name__)

# JPL body IDs for convenience
BODY_IDS = {
    "sun": "10",
    "mercury": "199",
    "venus": "299",
    "earth": "399",
    "mars": "499",
    "jupiter": "599",
    "saturn": "699",
    "uranus": "799",
    "neptune": "899",
    "moon": "301",
}


@dataclass
class EphemerisPoint:
    """A single point in an ephemeris."""
    time: str
    ra: float            # degrees
    dec: float           # degrees
    delta: float         # AU — observer-body distance
    r: float             # AU — heliocentric distance
    phase_angle: float   # degrees
    illumination: float  # percent
    magnitude: float
    ra_rate: float = 0.0   # arcsec/h
    dec_rate: float = 0.0  # arcsec/h
    extra: dict = field(default_factory=dict)


def get_current_position(
    target: str,
    observer_lat: float = DEFAULT_LAT,
    observer_lon: float = DEFAULT_LON,
) -> EphemerisPoint:
    """Return the current sky position and physical properties of *target*.

    Parameters
    ----------
    target:
        Body name (case-insensitive) or JPL numeric ID string.
    observer_lat / observer_lon:
        Observer geodetic coordinates in decimal degrees.
    """
    from astropy.time import TimeDelta

    body_id = BODY_IDS.get(target.lower(), target)
    now = Time.now()
    start = now.iso.split(".")[0]
    # Horizons requires stop > start; fetch 2 hours ahead, use first row
    stop = (now + TimeDelta(7200, format="sec")).iso.split(".")[0]
    df = get_ephemeris(
        target=body_id,
        start=start,
        stop=stop,
        step="1h",
        observer_lat=observer_lat,
        observer_lon=observer_lon,
    )
    return _row_to_point(df.iloc[0])


def get_ephemeris_table(
    target: str,
    start: str,
    stop: str,
    step: str = "1d",
    observer_lat: float = DEFAULT_LAT,
    observer_lon: float = DEFAULT_LON,
) -> pd.DataFrame:
    """Return a multi-row ephemeris DataFrame for *target* over a date range."""
    body_id = BODY_IDS.get(target.lower(), target)
    return get_ephemeris(
        target=body_id,
        start=start,
        stop=stop,
        step=step,
        observer_lat=observer_lat,
        observer_lon=observer_lon,
    )


def _row_to_point(row: pd.Series) -> EphemerisPoint:
    """Convert a single Horizons ephemeris row to an EphemerisPoint."""

    def _get(col: str, default: float = 0.0) -> float:
        val = row.get(col, default)
        try:
            return float(val)
        except (TypeError, ValueError):
            return default

    return EphemerisPoint(
        time=str(row.get("datetime_str", row.get("datetime_jd", ""))),
        ra=_get("RA"),
        dec=_get("DEC"),
        delta=_get("delta"),
        r=_get("r"),
        phase_angle=_get("alpha"),
        illumination=_get("illumination"),
        magnitude=_get("V"),
        ra_rate=_get("RA_rate"),
        dec_rate=_get("DEC_rate"),
    )
