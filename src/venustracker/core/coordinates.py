"""Coordinate utilities — RA/Dec ↔ Alt/Az, angular separation."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Tuple

import numpy as np
from astropy import units as u
from astropy.coordinates import AltAz, EarthLocation, SkyCoord
from astropy.time import Time


@dataclass
class AltAzResult:
    altitude: float   # degrees above horizon
    azimuth: float    # degrees east of north
    airmass: float | None = None


def radec_to_altaz(
    ra: float,
    dec: float,
    lat: float,
    lon: float,
    elevation: float = 0.0,
    time: str | None = None,
) -> AltAzResult:
    """Convert equatorial coordinates to horizon coordinates.

    Parameters
    ----------
    ra / dec:
        Right ascension and declination in decimal degrees (J2000).
    lat / lon:
        Observer geodetic coordinates in decimal degrees.
    elevation:
        Observer elevation above sea level in metres.
    time:
        ISO datetime string; defaults to current UTC time.

    Returns
    -------
    AltAzResult with altitude, azimuth (degrees) and airmass.
    """
    t = Time(time) if time else Time.now()
    location = EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=elevation * u.m)
    frame = AltAz(obstime=t, location=location)
    coord = SkyCoord(ra=ra * u.deg, dec=dec * u.deg, frame="icrs")
    altaz = coord.transform_to(frame)
    airmass = float(altaz.secz) if altaz.alt.deg > 0 else None
    return AltAzResult(
        altitude=float(altaz.alt.deg),
        azimuth=float(altaz.az.deg),
        airmass=airmass,
    )


def angular_separation(ra1: float, dec1: float, ra2: float, dec2: float) -> float:
    """Return the angular separation in degrees between two sky positions."""
    c1 = SkyCoord(ra=ra1 * u.deg, dec=dec1 * u.deg, frame="icrs")
    c2 = SkyCoord(ra=ra2 * u.deg, dec=dec2 * u.deg, frame="icrs")
    return float(c1.separation(c2).deg)


def position_angle(ra1: float, dec1: float, ra2: float, dec2: float) -> float:
    """Return the position angle (degrees E of N) from point 1 to point 2."""
    c1 = SkyCoord(ra=ra1 * u.deg, dec=dec1 * u.deg, frame="icrs")
    c2 = SkyCoord(ra=ra2 * u.deg, dec=dec2 * u.deg, frame="icrs")
    return float(c1.position_angle(c2).deg)


def hours_to_deg(hours: float) -> float:
    """Convert hours of right ascension to decimal degrees."""
    return hours * 15.0


def deg_to_hms(deg: float) -> Tuple[int, int, float]:
    """Convert decimal degrees RA to (h, m, s) tuple."""
    hours = deg / 15.0
    h = int(hours)
    m = int((hours - h) * 60)
    s = ((hours - h) * 60 - m) * 60
    return h, m, s


def format_ra(deg: float) -> str:
    """Format RA decimal degrees as ``HH MM SS.s``."""
    h, m, s = deg_to_hms(deg % 360)
    return f"{h:02d}h {m:02d}m {s:04.1f}s"


def format_dec(deg: float) -> str:
    """Format Dec decimal degrees as ``±DD MM SS``."""
    sign = "+" if deg >= 0 else "-"
    deg = abs(deg)
    d = int(deg)
    m = int((deg - d) * 60)
    s = ((deg - d) * 60 - m) * 60
    return f"{sign}{d:02d}° {m:02d}' {s:04.1f}\""
