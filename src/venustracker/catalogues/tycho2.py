"""Tycho-2 catalogue (I/259) — 2.5 million stars."""

from __future__ import annotations

import pandas as pd

from venustracker.feeds.vizier import cone_search, get_catalog

CATALOG_ID = "I/259/tyc2"
DEFAULT_COLS = ["TYC1", "TYC2", "TYC3", "RAmdeg", "DEmdeg", "VTmag", "BTmag", "pmRA", "pmDE"]


def search_cone(
    ra: float,
    dec: float,
    radius: float = 0.5,
    mag_limit: float | None = None,
    row_limit: int = 1000,
) -> pd.DataFrame:
    """Cone search the Tycho-2 catalogue.

    Parameters
    ----------
    ra / dec:
        Centre in decimal degrees (J2000).
    radius:
        Search radius in degrees.
    mag_limit:
        Filter to stars with VT magnitude ≤ this value.

    Returns
    -------
    pd.DataFrame with Tycho-2 columns.
    """
    df = cone_search(CATALOG_ID, ra, dec, radius, columns=DEFAULT_COLS, row_limit=row_limit)
    if df.empty:
        return df
    if mag_limit is not None and "VTmag" in df.columns:
        df = df[df["VTmag"] <= mag_limit]
    return df.reset_index(drop=True)


def tycho_id(row: pd.Series) -> str:
    """Return a formatted Tycho-2 identifier string like ``TYC 1234-5678-1``."""
    return f"TYC {int(row['TYC1'])}-{int(row['TYC2'])}-{int(row['TYC3'])}"
