"""Hipparcos catalogue (I/239) — 117,934 bright stars."""

from __future__ import annotations

import pandas as pd

from venustracker.feeds.vizier import cone_search, get_catalog

CATALOG_ID = "I/239/hip_main"
DEFAULT_COLS = ["HIP", "RArad", "DErad", "Vmag", "Plx", "pmRA", "pmDE", "B-V"]


def search_cone(
    ra: float,
    dec: float,
    radius: float = 1.0,
    mag_limit: float | None = None,
    row_limit: int = 500,
) -> pd.DataFrame:
    """Cone search the Hipparcos catalogue.

    Parameters
    ----------
    ra / dec:
        Centre in decimal degrees (J2000).
    radius:
        Search radius in degrees.
    mag_limit:
        If set, filter to stars brighter than this V magnitude.

    Returns
    -------
    pd.DataFrame with columns: HIP, RArad, DErad, Vmag, Plx, pmRA, pmDE, B-V.
    """
    df = cone_search(CATALOG_ID, ra, dec, radius, columns=DEFAULT_COLS, row_limit=row_limit)
    if df.empty:
        return df
    if mag_limit is not None and "Vmag" in df.columns:
        df = df[df["Vmag"] <= mag_limit]
    return df.reset_index(drop=True)


def get_sample(row_limit: int = 1000) -> pd.DataFrame:
    """Return a sample of Hipparcos stars (useful for testing)."""
    return get_catalog(CATALOG_ID, columns=DEFAULT_COLS, row_limit=row_limit)
