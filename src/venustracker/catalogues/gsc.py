"""GSC 2.3 — Guide Star Catalogue (I/305) — ~2 billion objects.

Only cone searches are practical; bulk downloads are not supported.
"""

from __future__ import annotations

import pandas as pd

from venustracker.feeds.vizier import cone_search

CATALOG_ID = "I/305/out"
DEFAULT_COLS = ["GSC2.3", "RAJ2000", "DEJ2000", "Vmag", "Fmag", "Jmag", "Umag", "Bmag", "Class"]

# GSC is enormous — keep cone radii and row limits conservative
MAX_RADIUS_DEG = 0.25
DEFAULT_ROW_LIMIT = 500


def search_cone(
    ra: float,
    dec: float,
    radius: float = 0.1,
    mag_limit: float | None = None,
    row_limit: int = DEFAULT_ROW_LIMIT,
) -> pd.DataFrame:
    """Cone search the GSC 2.3 catalogue.

    Parameters
    ----------
    ra / dec:
        Centre in decimal degrees (J2000).
    radius:
        Search radius in degrees (capped at 0.25° to prevent runaway queries).
    mag_limit:
        Filter to objects with V magnitude ≤ this value.

    Returns
    -------
    pd.DataFrame with GSC 2.3 columns.
    """
    radius = min(radius, MAX_RADIUS_DEG)
    df = cone_search(CATALOG_ID, ra, dec, radius, columns=DEFAULT_COLS, row_limit=row_limit)
    if df.empty:
        return df
    if mag_limit is not None and "Vmag" in df.columns:
        df = df[df["Vmag"] <= mag_limit]
    return df.reset_index(drop=True)
