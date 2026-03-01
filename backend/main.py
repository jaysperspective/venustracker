"""VenusTracker FastAPI backend — wraps AstronomicalService for the web UI."""

from __future__ import annotations

import re
import sys
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path
from typing import Any

# Ensure the src package is importable when running from the backend/ directory
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from venustracker.service import AstronomicalService

_origins = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,capacitor://localhost"
).split(",") if o.strip()]

app = FastAPI(title="VenusTracker API", version="1.0.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _zodiac_sign(ra: float, dec: float) -> str:
    """Convert Venus RA/Dec to ecliptic longitude and return zodiac sign."""
    from astropy.coordinates import SkyCoord, GeocentricMeanEcliptic
    from astropy.time import Time
    import astropy.units as u

    coord = SkyCoord(ra=ra * u.deg, dec=dec * u.deg, frame="icrs")
    ecl = coord.transform_to(GeocentricMeanEcliptic(equinox=Time.now()))
    lon = ecl.lon.deg % 360
    signs = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
    ]
    return signs[int(lon // 30)]


def _serialize_calendar_year(cy: Any) -> dict:
    """Manually serialize VenusCalendarYear dataclass to a JSON-safe dict."""

    def _d(d: date | None) -> str | None:
        return d.isoformat() if d else None

    months = [
        {
            "number": m.number,
            "start_date": _d(m.start_date),
            "end_date": _d(m.end_date),
            "days": m.days,
            "phase": m.phase,
        }
        for m in cy.months
    ]

    holidays = [
        {
            "name": h.name,
            "month": h.month,
            "day": h.day,
            "gregorian_date": _d(h.gregorian_date),
            "description": h.description,
        }
        for h in cy.holidays
    ]

    return {
        "year_number": cy.year_number,
        "new_year_date": _d(cy.new_year_date),
        "end_date": _d(cy.end_date),
        "months": months,
        "holidays": holidays,
        "inferior_conjunction": _d(cy.inferior_conjunction),
        "superior_conjunction": _d(cy.superior_conjunction),
        "greatest_eastern_elongation": _d(cy.greatest_eastern_elongation),
        "greatest_western_elongation": _d(cy.greatest_western_elongation),
        "retrograde_start": _d(cy.retrograde_start),
        "retrograde_end": _d(cy.retrograde_end),
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/venus")
@limiter.limit("30/minute")
def get_venus(
    request: Request,
    lat: float = Query(default=0.0),
    lon: float = Query(default=0.0),
) -> dict:
    """Return current Venus status including zodiac sign."""
    svc = AstronomicalService(observer_lat=lat, observer_lon=lon)
    status = svc.venus_status()
    pos = status.position

    zodiac = _zodiac_sign(pos.ra, pos.dec)

    return {
        "ra": pos.ra,
        "dec": pos.dec,
        "altitude": status.altitude,
        "azimuth": status.azimuth,
        "elongation": status.elongation,
        "is_evening_star": status.is_evening_star,
        "phase": status.phase_desc,
        "illumination": status.illumination,
        "magnitude": status.magnitude,
        "distance_au": pos.delta,
        "zodiac": zodiac,
    }


@app.get("/api/venus/ephemeris")
@limiter.limit("10/minute")
def get_ephemeris(
    request: Request,
    days: int = Query(default=30, ge=1, le=365),
    lat: float = Query(default=0.0),
    lon: float = Query(default=0.0),
) -> list[dict]:
    """Return daily Venus elongation values for the sparkline chart."""
    svc = AstronomicalService(observer_lat=lat, observer_lon=lon)
    df = svc.venus_ephemeris(days=days)

    if df.empty:
        return []

    result = []
    for i in range(len(df)):
        try:
            dt_str = str(df.iloc[i].get("datetime_str", ""))
            # JPL Horizons returns elongation directly in the 'elong' column
            elong = float(df.iloc[i]["elong"])
            result.append({"date": dt_str, "elongation": round(elong, 2)})
        except Exception:
            continue

    return result


def _parse_event_date(raw: str) -> str:
    """Convert Horizons date strings like '2026-Aug-14 20:42:49' to ISO '2026-08-14'."""
    from datetime import datetime
    raw = str(raw).strip()
    for fmt in ("%Y-%b-%d %H:%M:%S", "%Y-%b-%d %H:%M", "%Y-%b-%d", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw[:len(fmt) + 2].strip(), fmt).date().isoformat()
        except ValueError:
            continue
    return raw.split()[0]  # best-effort fallback


@app.get("/api/venus/events")
@limiter.limit("10/minute")
def get_events(
    request: Request,
    days: int = Query(default=365, ge=1, le=730),
    lat: float = Query(default=0.0),
    lon: float = Query(default=0.0),
) -> list[dict]:
    """Return upcoming Venus events with ISO-formatted dates."""
    svc = AstronomicalService(observer_lat=lat, observer_lon=lon)
    events = svc.venus_events(days=days)
    for ev in events:
        ev["date"] = _parse_event_date(ev.get("date", ""))
    return events


@app.get("/api/calendar/today")
@limiter.limit("30/minute")
def get_calendar_today(
    request: Request,
    lat: float = Query(default=0.0),
    lon: float = Query(default=0.0),
) -> dict:
    """Return today's Venus calendar date."""
    svc = AstronomicalService(observer_lat=lat, observer_lon=lon)
    result = svc.calendar_today()

    # Remove non-serializable VenusCalendarYear object if present
    serializable = {k: v for k, v in result.items() if k != "calendar_year"}
    return serializable


@app.get("/api/news")
@limiter.limit("20/minute")
def get_news(request: Request, category: str = Query(default="all")) -> list[dict]:
    """Return Venus news articles from Google News RSS feeds."""
    from venustracker.cache import get_cache

    cache_key = f"venus_news:{category}"
    c = get_cache()
    if cache_key in c:
        return c[cache_key]

    astronomy_url = (
        "https://news.google.com/rss/search"
        "?q=Venus+planet+astronomy+NASA+space+when:90d&hl=en&gl=US&ceid=US:en"
    )
    astrology_url = (
        "https://news.google.com/rss/search"
        "?q=Venus+astrology+retrograde+mythology+spiritual+when:90d&hl=en&gl=US&ceid=US:en"
    )

    articles: list[dict] = []
    if category in ("astronomy", "all"):
        articles.extend(_fetch_rss(astronomy_url, "astronomy"))
    if category in ("astrology", "all"):
        articles.extend(_fetch_rss(astrology_url, "astrology"))

    from email.utils import parsedate_to_datetime
    def _pub_ts(a: dict) -> float:
        try:
            return parsedate_to_datetime(a["published"]).timestamp()
        except Exception:
            return 0.0

    articles.sort(key=_pub_ts, reverse=True)
    c.set(cache_key, articles, expire=900)
    return articles


def _fetch_rss(url: str, category: str) -> list[dict]:
    """Fetch and parse a Google News RSS feed; return up to 15 articles."""
    import httpx

    try:
        resp = httpx.get(url, timeout=10, follow_redirects=True, headers={"User-Agent": "VenusTracker/1.0"})
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
    except Exception:
        return []

    ns = {"source": "http://www.google.com/schemas/sitemap/0.84"}
    items = root.findall(".//item")[:15]
    results = []
    for item in items:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_date = (item.findtext("pubDate") or "").strip()
        raw_desc = item.findtext("description") or ""
        summary = re.sub(r"<[^>]+>", "", raw_desc).strip()

        source_el = item.find("source")
        source = source_el.text.strip() if source_el is not None and source_el.text else ""

        results.append({
            "title": title,
            "url": link,
            "source": source,
            "published": pub_date,
            "summary": summary,
            "category": category,
        })
    return results


@app.get("/api/calendar/year")
@limiter.limit("10/minute")
def get_calendar_year(
    request: Request,
    year: int = Query(default=2026),
    lat: float = Query(default=0.0),
    lon: float = Query(default=0.0),
) -> dict:
    """Return the full Venus calendar year overlapping the given Gregorian year."""
    svc = AstronomicalService(observer_lat=lat, observer_lon=lon)
    cy = svc.calendar_year(year)
    return _serialize_calendar_year(cy)
