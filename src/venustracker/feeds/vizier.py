"""VizieR base client — catalogue access via astroquery."""

from __future__ import annotations

import logging
from typing import Optional, Sequence

import pandas as pd
from astropy import units as u
from astropy.coordinates import SkyCoord
from astroquery.vizier import Vizier

from venustracker.cache import cached
from venustracker.config import TTL_VIZIER

log = logging.getLogger(__name__)


def _vizier(columns: Sequence[str] | None, row_limit: int) -> Vizier:
    col_list = list(columns) if columns else ["**"]
    return Vizier(columns=col_list, row_limit=row_limit)


@cached("vizier:cone", TTL_VIZIER)
def cone_search(
    catalog_id: str,
    ra: float,
    dec: float,
    radius: float = 1.0,
    columns: Sequence[str] | None = None,
    row_limit: int = 500,
) -> pd.DataFrame:
    """Cone search a VizieR catalogue.

    Parameters
    ----------
    catalog_id:
        VizieR catalogue identifier, e.g. ``"I/239/hip_main"``.
    ra / dec:
        Centre of the cone in decimal degrees (J2000).
    radius:
        Search radius in degrees.
    columns:
        Column names to retrieve; ``None`` means all columns.
    row_limit:
        Maximum rows to return (``-1`` for unlimited).

    Returns
    -------
    pd.DataFrame or empty DataFrame on no results.
    """
    v = _vizier(columns, row_limit)
    coord = SkyCoord(ra=ra * u.deg, dec=dec * u.deg, frame="icrs")
    log.debug("VizieR cone_search: %s @ (%.4f, %.4f) r=%.2f°", catalog_id, ra, dec, radius)
    result = v.query_region(coord, radius=radius * u.deg, catalog=catalog_id)
    if not result:
        return pd.DataFrame()
    return result[0].to_pandas()


@cached("vizier:catalog", TTL_VIZIER)
def get_catalog(
    catalog_id: str,
    columns: Sequence[str] | None = None,
    row_limit: int = 1000,
) -> pd.DataFrame:
    """Bulk-pull the first *row_limit* rows of a VizieR catalogue.

    Avoid on huge catalogues (GSC); prefer ``cone_search`` instead.
    """
    v = _vizier(columns, row_limit)
    log.debug("VizieR get_catalog: %s (limit=%d)", catalog_id, row_limit)
    result = v.get_catalogs(catalog_id)
    if not result:
        return pd.DataFrame()
    return result[0].to_pandas()
