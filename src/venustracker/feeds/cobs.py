"""COBS — Comet Observation Database REST client.

API docs: https://cobs.si/help/cobs_api/observation_list_api/
Endpoint: GET https://cobs.si/api/obs_list.api
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

import httpx
import pandas as pd

log = logging.getLogger(__name__)

_BASE_URL = "https://cobs.si/api/obs_list.api"
_TIMEOUT = 20.0


def _fetch(params: dict) -> list | dict:
    with httpx.Client(timeout=_TIMEOUT) as client:
        resp = client.get(_BASE_URL, params=params)
        resp.raise_for_status()
        return resp.json()


def get_recent_observations(
    comet: str | None = None,
    limit: int = 50,
    days_back: int = 180,
) -> pd.DataFrame:
    """Fetch recent comet observations from COBS.

    Parameters
    ----------
    comet:
        Comet designation filter (e.g. ``"C/2023 A3"``).
        ``None`` returns observations for all comets.
    limit:
        Maximum number of records to return.
    days_back:
        How many days back to search (default 180).

    Returns
    -------
    pd.DataFrame with observation columns, or empty DataFrame on failure.
    """
    from_date = (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%d 00:00")
    params: dict = {"format": "json", "from_date": from_date}
    if comet:
        params["des"] = comet

    log.debug("COBS request: %s params=%s", _BASE_URL, params)

    try:
        data = _fetch(params)
    except httpx.HTTPStatusError as exc:
        log.warning("COBS HTTP error %s: %s", exc.response.status_code, exc)
        return pd.DataFrame()
    except httpx.HTTPError as exc:
        log.warning("COBS request failed: %s", exc)
        return pd.DataFrame()

    # Response: {"info": {...}, "objects": [...]}
    if isinstance(data, list):
        records = data
    elif isinstance(data, dict):
        records = data.get("objects") or data.get("results") or []
    else:
        records = []

    if not records:
        return pd.DataFrame()

    df = pd.json_normalize(records)
    return df.head(limit).reset_index(drop=True)


def get_comet_list() -> pd.DataFrame:
    """Return a DataFrame of comets with recent observations in COBS."""
    from_date = (datetime.utcnow() - timedelta(days=365)).strftime("%Y-%m-%d 00:00")
    params = {"format": "json", "from_date": from_date}
    try:
        data = _fetch(params)
    except httpx.HTTPError as exc:
        log.warning("COBS comet list failed: %s", exc)
        return pd.DataFrame()

    if isinstance(data, list):
        records = data
    elif isinstance(data, dict):
        records = data.get("objects") or data.get("results") or []
    else:
        records = []

    if not records:
        return pd.DataFrame()

    df = pd.json_normalize(records)
    # Return unique comet designations
    comet_col = next((c for c in df.columns if "name" in c.lower() or "des" in c.lower()), None)
    if comet_col:
        return df[[comet_col]].drop_duplicates().reset_index(drop=True)
    return df
