"""PGC — Principal Galaxies Catalogue (VII/237) — ~983k galaxies."""

from __future__ import annotations

import pandas as pd

from venustracker.feeds.vizier import cone_search, get_catalog

CATALOG_ID = "VII/237/pgc"
DEFAULT_COLS = ["PGC", "RAJ2000", "DEJ2000", "Type", "logD25", "logR25", "BT", "Vrot", "PA"]


def search_cone(
    ra: float,
    dec: float,
    radius: float = 1.0,
    row_limit: int = 200,
) -> pd.DataFrame:
    """Cone search the PGC catalogue.

    Parameters
    ----------
    ra / dec:
        Centre in decimal degrees (J2000).
    radius:
        Search radius in degrees.

    Returns
    -------
    pd.DataFrame with galaxy properties.
    """
    df = cone_search(CATALOG_ID, ra, dec, radius, columns=DEFAULT_COLS, row_limit=row_limit)
    if df.empty:
        return df
    return df.reset_index(drop=True)


def angular_diameter_arcmin(row: pd.Series) -> float | None:
    """Convert logD25 (0.1 arcmin log10) to angular diameter in arcminutes."""
    if "logD25" not in row or pd.isna(row["logD25"]):
        return None
    return 10 ** (row["logD25"] * 0.1)
