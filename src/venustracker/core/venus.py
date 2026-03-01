"""Venus-specific logic — position, phase, elongation, upcoming events."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import numpy as np
import pandas as pd
from astropy.time import Time

from venustracker.config import DEFAULT_LAT, DEFAULT_LON, VENUS_ID
from venustracker.core.coordinates import angular_separation, format_dec, format_ra, radec_to_altaz
from venustracker.core.ephemeris import EphemerisPoint, get_current_position, get_ephemeris_table
from venustracker.feeds.horizons import get_ephemeris

log = logging.getLogger(__name__)

# Sun's JPL ID
_SUN_ID = "10"


@dataclass
class VenusStatus:
    position: EphemerisPoint
    altitude: float         # degrees above horizon (observer-dependent)
    azimuth: float          # degrees E of N
    elongation: float       # angular separation from Sun (degrees)
    is_evening_star: bool   # east of Sun = evening; west = morning
    phase_desc: str         # human-readable phase description
    illumination: float     # percent
    magnitude: float


def current_position(
    observer_lat: float = DEFAULT_LAT,
    observer_lon: float = DEFAULT_LON,
) -> EphemerisPoint:
    """Return Venus's current RA/Dec and physical properties."""
    return get_current_position("venus", observer_lat, observer_lon)


def current_status(
    observer_lat: float = DEFAULT_LAT,
    observer_lon: float = DEFAULT_LON,
) -> VenusStatus:
    """Return a full status snapshot of Venus for the given observer."""
    pos = current_position(observer_lat, observer_lon)
    altaz = radec_to_altaz(pos.ra, pos.dec, observer_lat, observer_lon)

    # Sun position for elongation
    sun_pos = get_current_position("sun", observer_lat, observer_lon)
    elong = angular_separation(pos.ra, pos.dec, sun_pos.ra, sun_pos.dec)

    # Evening star: Venus RA > Sun RA (east of Sun in the sky)
    is_evening = (pos.ra - sun_pos.ra) % 360 < 180

    return VenusStatus(
        position=pos,
        altitude=altaz.altitude,
        azimuth=altaz.azimuth,
        elongation=elong,
        is_evening_star=is_evening,
        phase_desc=_phase_description(pos.phase_angle, elong, is_evening),
        illumination=pos.illumination,
        magnitude=pos.magnitude,
    )


def elongation_angle(
    observer_lat: float = DEFAULT_LAT,
    observer_lon: float = DEFAULT_LON,
) -> float:
    """Return Venus's current angular separation from the Sun in degrees."""
    venus_pos = current_position(observer_lat, observer_lon)
    sun_pos = get_current_position("sun", observer_lat, observer_lon)
    return angular_separation(venus_pos.ra, venus_pos.dec, sun_pos.ra, sun_pos.dec)


def phase_description(
    observer_lat: float = DEFAULT_LAT,
    observer_lon: float = DEFAULT_LON,
) -> str:
    """Return a human-readable description of Venus's current phase."""
    status = current_status(observer_lat, observer_lon)
    return status.phase_desc


def next_events(
    days: int = 365,
    observer_lat: float = DEFAULT_LAT,
    observer_lon: float = DEFAULT_LON,
) -> list[dict]:
    """Scan the next *days* to find key Venus events.

    Looks for: greatest eastern/western elongation, inferior/superior
    conjunction, and dichotomy (50% illumination).

    Returns a list of dicts: {event, date, elongation, illumination}.
    """
    now = Time.now()
    start = now.iso.split(".")[0]
    stop = (now + days).iso.split(".")[0]

    venus_df = get_ephemeris(
        target=VENUS_ID,
        start=start,
        stop=stop,
        step="1d",
        observer_lat=observer_lat,
        observer_lon=observer_lon,
    )
    sun_df = get_ephemeris(
        target=_SUN_ID,
        start=start,
        stop=stop,
        step="1d",
        observer_lat=observer_lat,
        observer_lon=observer_lon,
    )

    if venus_df.empty or sun_df.empty:
        return []

    # Align on common index
    n = min(len(venus_df), len(sun_df))
    v = venus_df.iloc[:n].reset_index(drop=True)
    s = sun_df.iloc[:n].reset_index(drop=True)

    elong = np.array([
        angular_separation(float(v.loc[i, "RA"]), float(v.loc[i, "DEC"]),
                           float(s.loc[i, "RA"]), float(s.loc[i, "DEC"]))
        for i in range(n)
    ])

    # RA difference for east/west discrimination
    ra_diff = (v["RA"].astype(float).values - s["RA"].astype(float).values) % 360
    is_east = ra_diff < 180

    illum = v["illumination"].astype(float).values if "illumination" in v.columns else np.full(n, np.nan)
    dates = v["datetime_str"].values if "datetime_str" in v.columns else v.index.astype(str)

    events: list[dict] = []

    # Greatest elongations (local maxima)
    for i in range(1, n - 1):
        if elong[i] > elong[i - 1] and elong[i] > elong[i + 1]:
            direction = "eastern" if is_east[i] else "western"
            events.append({
                "event": f"Greatest {direction} elongation",
                "date": str(dates[i]),
                "elongation_deg": round(float(elong[i]), 2),
                "illumination": round(float(illum[i]), 1),
            })

    # Conjunctions (elongation < 5°)
    prev_conj = False
    for i in range(n):
        if elong[i] < 5.0:
            if not prev_conj:
                conj_type = "superior" if float(v.loc[i, "delta"]) > 1.5 else "inferior"
                events.append({
                    "event": f"{conj_type.capitalize()} conjunction",
                    "date": str(dates[i]),
                    "elongation_deg": round(float(elong[i]), 2),
                    "illumination": round(float(illum[i]), 1),
                })
            prev_conj = True
        else:
            prev_conj = False

    # Dichotomy (illumination ≈ 50%)
    for i in range(1, n):
        if abs(illum[i] - 50.0) < 1.5 and abs(illum[i - 1] - 50.0) >= 1.5:
            events.append({
                "event": "Dichotomy (50% illuminated)",
                "date": str(dates[i]),
                "elongation_deg": round(float(elong[i]), 2),
                "illumination": round(float(illum[i]), 1),
            })

    events.sort(key=lambda e: e["date"])
    return events


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _phase_description(phase_angle: float, elong: float, is_evening: bool) -> str:
    """Map numeric phase angle + geometry to a descriptive string."""
    if elong < 5:
        if phase_angle > 90:
            return "Inferior conjunction (between Earth and Sun)"
        else:
            return "Superior conjunction (behind the Sun)"

    if is_evening:
        if phase_angle < 45:
            return "Gibbous phase — evening star"
        elif phase_angle < 90:
            return "Half-phase (dichotomy) — evening star"
        else:
            return "Crescent phase — evening star"
    else:
        if phase_angle < 45:
            return "Gibbous phase — morning star"
        elif phase_angle < 90:
            return "Half-phase (dichotomy) — morning star"
        else:
            return "Crescent phase — morning star"
