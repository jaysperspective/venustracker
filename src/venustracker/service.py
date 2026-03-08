"""AstronomicalService — unified data orchestrator."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import pandas as pd

from venustracker.config import DEFAULT_LAT, DEFAULT_LON, DEFAULT_FOV_DEG
from venustracker.core.venus import VenusStatus, current_status
from venustracker.core.ephemeris import get_ephemeris_table
from venustracker.core.coordinates import angular_separation, format_ra, format_dec

log = logging.getLogger(__name__)


@dataclass
class SkySnapshot:
    """Aggregated data for a region of sky."""
    ra: float
    dec: float
    radius_deg: float
    hipparcos: pd.DataFrame = field(default_factory=pd.DataFrame)
    tycho2: pd.DataFrame = field(default_factory=pd.DataFrame)
    galaxies: pd.DataFrame = field(default_factory=pd.DataFrame)
    venus_status: Optional[VenusStatus] = None
    dss_fits_path: Optional[Path] = None


class AstronomicalService:
    """Compose all feeds and catalogues into high-level query methods.

    Parameters
    ----------
    observer_lat / observer_lon:
        Default observer position in decimal degrees.
    """

    def __init__(
        self,
        observer_lat: float = DEFAULT_LAT,
        observer_lon: float = DEFAULT_LON,
    ) -> None:
        self.observer_lat = observer_lat
        self.observer_lon = observer_lon

    # ------------------------------------------------------------------
    # Venus
    # ------------------------------------------------------------------

    def venus_status(self) -> VenusStatus:
        """Return a full Venus status snapshot for the configured observer."""
        return current_status(self.observer_lat, self.observer_lon)

    def venus_ephemeris(self, days: int = 30, step: str = "1d") -> pd.DataFrame:
        """Return a multi-day Venus ephemeris table."""
        from astropy.time import Time

        now = Time.now()
        start = now.iso.split(".")[0]
        stop = (now + days).iso.split(".")[0]
        return get_ephemeris_table(
            "venus",
            start=start,
            stop=stop,
            step=step,
            observer_lat=self.observer_lat,
            observer_lon=self.observer_lon,
        )

    def venus_events(self, days: int = 365) -> list[dict]:
        """Return upcoming Venus events (conjunctions, elongations, dichotomy)."""
        from venustracker.core.venus import next_events
        return next_events(days=days, observer_lat=self.observer_lat, observer_lon=self.observer_lon)

    # ------------------------------------------------------------------
    # Star catalogues
    # ------------------------------------------------------------------

    def query_hipparcos(
        self,
        ra: float,
        dec: float,
        radius: float = 1.0,
        mag_limit: float | None = None,
    ) -> pd.DataFrame:
        from venustracker.catalogues.hipparcos import search_cone
        return search_cone(ra, dec, radius, mag_limit=mag_limit)

    def query_tycho2(
        self,
        ra: float,
        dec: float,
        radius: float = 0.5,
        mag_limit: float | None = None,
    ) -> pd.DataFrame:
        from venustracker.catalogues.tycho2 import search_cone
        return search_cone(ra, dec, radius, mag_limit=mag_limit)

    def query_galaxies(
        self,
        ra: float,
        dec: float,
        radius: float = 1.0,
    ) -> pd.DataFrame:
        from venustracker.catalogues.pgc import search_cone
        return search_cone(ra, dec, radius)

    def query_gsc(
        self,
        ra: float,
        dec: float,
        radius: float = 0.1,
        mag_limit: float | None = None,
    ) -> pd.DataFrame:
        from venustracker.catalogues.gsc import search_cone
        return search_cone(ra, dec, radius, mag_limit=mag_limit)

    # ------------------------------------------------------------------
    # Comets
    # ------------------------------------------------------------------

    def query_comets(self, comet: str | None = None, limit: int = 50) -> pd.DataFrame:
        from venustracker.feeds.cobs import get_recent_observations
        return get_recent_observations(comet=comet, limit=limit)

    # ------------------------------------------------------------------
    # DSS imagery
    # ------------------------------------------------------------------

    def get_sky_image(
        self,
        ra: float,
        dec: float,
        fov_deg: float = DEFAULT_FOV_DEG,
        survey: str = "DSS2 Red",
    ) -> Path:
        from venustracker.feeds.dss import get_image
        return get_image(ra, dec, fov_deg=fov_deg, survey=survey)

    # ------------------------------------------------------------------
    # Unified snapshot
    # ------------------------------------------------------------------

    def sky_snapshot(
        self,
        ra: float,
        dec: float,
        radius_deg: float = 1.0,
        include_dss: bool = True,
    ) -> SkySnapshot:
        """Pull stars, galaxies, Venus status, and optionally a DSS image.

        All data is cached locally after the first call.
        """
        snap = SkySnapshot(ra=ra, dec=dec, radius_deg=radius_deg)

        log.info("sky_snapshot: ra=%.4f dec=%.4f r=%.2f°", ra, dec, radius_deg)

        snap.hipparcos = self.query_hipparcos(ra, dec, radius_deg)
        snap.tycho2 = self.query_tycho2(ra, dec, min(radius_deg, 0.5))
        snap.galaxies = self.query_galaxies(ra, dec, radius_deg)
        snap.venus_status = self.venus_status()

        if include_dss:
            try:
                snap.dss_fits_path = self.get_sky_image(ra, dec)
            except Exception as exc:
                log.warning("DSS image failed: %s", exc)

        return snap

    # ------------------------------------------------------------------
    # Venus Calendar
    # ------------------------------------------------------------------

    def calendar_today(self) -> dict:
        """Return today's date in the Venus synodic calendar."""
        from venustracker.core.calendar import today_in_venus_calendar
        return today_in_venus_calendar(self.observer_lat, self.observer_lon)

    def calendar_year(self, gregorian_year: int) -> object:
        """Return the VenusCalendarYear that contains the given Gregorian year."""
        from datetime import date
        from venustracker.core.calendar import (
            build_calendar_year, find_heliacal_rise, SYNODIC_DAYS,
        )
        from datetime import timedelta

        # Known anchor
        ANCHOR = date(2025, 3, 18)
        ANCHOR_YEAR = 1

        # Walk cycles to find the one overlapping gregorian_year
        target_start = date(gregorian_year, 1, 1)
        target_end = date(gregorian_year, 12, 31)

        cycle_start = ANCHOR
        cycle_year = ANCHOR_YEAR

        # Move forward past target if needed
        while cycle_start + timedelta(days=SYNODIC_DAYS) < target_start:
            cycle_start += timedelta(days=SYNODIC_DAYS)
            cycle_year += 1

        # Move backward before target if needed
        while cycle_start > target_end:
            cycle_start -= timedelta(days=SYNODIC_DAYS)
            cycle_year -= 1

        # Refine with actual heliacal rise search
        search_from = cycle_start - timedelta(days=30)
        found = find_heliacal_rise(search_from, search_days=90)
        new_year = found if found else cycle_start

        return build_calendar_year(
            new_year, year_number=cycle_year,
            observer_lat=self.observer_lat, observer_lon=self.observer_lon,
        )

    def venus_report(self) -> dict:
        """Return a dict summarising the full Venus state for the observer."""
        status = self.venus_status()
        pos = status.position
        return {
            "ra": pos.ra,
            "dec": pos.dec,
            "ra_formatted": format_ra(pos.ra),
            "dec_formatted": format_dec(pos.dec),
            "altitude": status.altitude,
            "azimuth": status.azimuth,
            "elongation_deg": status.elongation,
            "is_evening_star": status.is_evening_star,
            "phase_description": status.phase_desc,
            "illumination_pct": status.illumination,
            "magnitude": status.magnitude,
            "distance_au": pos.delta,
            "heliocentric_dist_au": pos.r,
        }
