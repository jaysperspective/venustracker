"""JPL Horizons feed — planetary ephemerides via astroquery."""

from __future__ import annotations

import logging
from typing import Optional

import pandas as pd
from astroquery.jplhorizons import Horizons

from venustracker.cache import cached
from venustracker.config import DEFAULT_LAT, DEFAULT_LON, TTL_HORIZONS, VENUS_ID

log = logging.getLogger(__name__)


def _observer_location(lat: float, lon: float, elevation: float = 0.0) -> dict:
    """Build a Horizons observer dict from lat/lon/elevation."""
    return {"lat": lat, "lon": lon, "elevation": elevation}


@cached("horizons:ephemeris", TTL_HORIZONS)
def get_ephemeris(
    target: str = VENUS_ID,
    start: str = "now",
    stop: str | None = None,
    step: str = "1d",
    observer_lat: float = DEFAULT_LAT,
    observer_lon: float = DEFAULT_LON,
    elevation: float = 0.0,
) -> pd.DataFrame:
    """Fetch an ephemeris table from JPL Horizons.

    Parameters
    ----------
    target:
        JPL body ID (e.g. ``"299"`` for Venus, ``"399"`` for Earth).
    start:
        ISO date string or ``"now"``.
    stop:
        ISO date string; defaults to *start* + 1 day when ``None``.
    step:
        Time step string accepted by Horizons (``"1h"``, ``"1d"`` …).
    observer_lat / observer_lon:
        Geodetic observer coordinates in decimal degrees.

    Returns
    -------
    pd.DataFrame
        Columns: datetime_jd, datetime_str, RA, DEC, delta, r,
                 alpha (phase angle), illumination, V (magnitude),
                 RA_rate, DEC_rate.
    """
    from astropy.time import Time

    from astropy.time import TimeDelta

    if start == "now":
        start = Time.now().iso.split(".")[0]
    if stop is None or stop == start:
        # Horizons requires stop > start; default to +1 day regardless of step
        t0 = Time(start, format="iso")
        stop = (t0 + TimeDelta(86400, format="sec")).iso.split(".")[0]

    location = _observer_location(observer_lat, observer_lon, elevation)
    log.debug("Horizons query: target=%s %s → %s step=%s", target, start, stop, step)

    obj = Horizons(id=target, location=location, epochs={"start": start, "stop": stop, "step": step})
    eph = obj.ephemerides(quantities="1,2,9,10,13,14,19,20,23,24,43")
    df = eph.to_pandas()
    return df


@cached("horizons:elements", TTL_HORIZONS)
def get_orbital_elements(
    target: str = VENUS_ID,
    epoch: str = "now",
    observer_lat: float = DEFAULT_LAT,
    observer_lon: float = DEFAULT_LON,
) -> pd.DataFrame:
    """Return osculating orbital elements for *target* at *epoch*."""
    from astropy.time import Time

    if epoch == "now":
        epoch = Time.now().iso.split(".")[0]

    location = _observer_location(observer_lat, observer_lon)
    obj = Horizons(id=target, location=location, epochs=epoch)
    elements = obj.elements()
    return elements.to_pandas()
