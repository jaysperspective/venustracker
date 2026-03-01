"""Venus synodic calendar — 13 months × 45 days anchored to heliacal rise."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional

import numpy as np

from venustracker.config import DEFAULT_LAT, DEFAULT_LON, SUN_ID, VENUS_ID
from venustracker.core.coordinates import angular_separation

log = logging.getLogger(__name__)


def _parse_horizons_date(dt_str: str) -> date:
    """Parse a Horizons datetime_str like '2025-Mar-2' or '2025-Mar-02' into a date."""
    from datetime import datetime
    # Horizons uses abbreviated month names, e.g. "2025-Mar-2 00:00"
    s = str(dt_str)[:11].strip()  # keep only date portion
    for fmt in ("%Y-%b-%d", "%Y-%b-%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    # Fallback: try stripping time portion and parsing with strptime
    s = s.split()[0]  # drop any time component
    return datetime.strptime(s, "%Y-%b-%d").date()


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SYNODIC_DAYS = 584          # nominal Venus synodic period (rounded)
MONTHS_PER_YEAR = 13
DAYS_PER_MONTH = 45         # 13 × 45 = 585 (1 intercalary absorbed in month 7)
HELIACAL_ELONGATION_DEG = 8.0  # minimum elongation for heliacal visibility

# Holiday names indexed by position in cycle
HOLIDAY_NEW_YEAR = "New Year Day"
HOLIDAY_GEE = "Greatest Eastern Elongation Day"
HOLIDAY_RETRO_START = "Retrograde Begins"
HOLIDAY_INF_CONJ = "Inferior Conjunction Day"
HOLIDAY_RETRO_END = "Retrograde Ends"
HOLIDAY_GWE = "Greatest Western Elongation Day"
HOLIDAY_SUP_CONJ = "Superior Conjunction Day"
HOLIDAY_INTERCALARY = "Intercalary Day"

# Phase labels (assigned to months)
PHASE_MORNING_STAR = "Morning Star"
PHASE_SUPERIOR_CONJ = "Superior Conjunction"
PHASE_EVENING_STAR = "Evening Star"
PHASE_RETROGRADE = "Retrograde"


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class VenusMonth:
    number: int           # 1–13
    start_date: date      # Gregorian
    end_date: date        # Gregorian (inclusive)
    days: int             # 45 normally; month 7 may be 46 when intercalary absorbed
    phase: str


@dataclass
class VenusHoliday:
    name: str
    month: int
    day: int              # Venus calendar day within month
    gregorian_date: date
    description: str


@dataclass
class VenusCalendarYear:
    year_number: int
    new_year_date: date
    end_date: date
    months: list[VenusMonth]
    holidays: list[VenusHoliday]
    inferior_conjunction: Optional[date]
    superior_conjunction: Optional[date]
    greatest_eastern_elongation: Optional[date]
    greatest_western_elongation: Optional[date]
    retrograde_start: Optional[date]
    retrograde_end: Optional[date]


# ---------------------------------------------------------------------------
# Internal ephemeris helper
# ---------------------------------------------------------------------------

def _fetch_daily(start: date, stop: date) -> tuple[object, object]:
    """Return (venus_df, sun_df) covering *start* to *stop* at 1-day steps."""
    from venustracker.feeds.horizons import get_ephemeris

    start_str = start.isoformat()
    stop_str = (stop + timedelta(days=1)).isoformat()  # Horizons stop is exclusive
    venus_df = get_ephemeris(target=VENUS_ID, start=start_str, stop=stop_str, step="1d")
    sun_df = get_ephemeris(target=SUN_ID, start=start_str, stop=stop_str, step="1d")
    return venus_df, sun_df


# ---------------------------------------------------------------------------
# Event finders
# ---------------------------------------------------------------------------

def find_heliacal_rise(
    search_start: date,
    search_days: int = 90,
) -> Optional[date]:
    """Return the first date Venus is visible in the pre-dawn sky.

    Criterion: elongation > HELIACAL_ELONGATION_DEG AND Venus is west of Sun
    (morning star), i.e. (RA_venus - RA_sun) % 360 > 180.
    """
    stop = search_start + timedelta(days=search_days)
    venus_df, sun_df = _fetch_daily(search_start, stop)

    if venus_df.empty or sun_df.empty:
        return None

    n = min(len(venus_df), len(sun_df))
    v = venus_df.iloc[:n].reset_index(drop=True)
    s = sun_df.iloc[:n].reset_index(drop=True)

    for i in range(n):
        v_ra = float(v.loc[i, "RA"])
        v_dec = float(v.loc[i, "DEC"])
        s_ra = float(s.loc[i, "RA"])
        s_dec = float(s.loc[i, "DEC"])

        elong = angular_separation(v_ra, v_dec, s_ra, s_dec)
        ra_diff = (v_ra - s_ra) % 360  # > 180 → morning star (west of Sun)
        is_morning = ra_diff > 180

        if elong >= HELIACAL_ELONGATION_DEG and is_morning:
            # Parse date from datetime_str column
            dt_str = str(v.loc[i, "datetime_str"])
            return _parse_horizons_date(dt_str)

    return None


def find_inferior_conjunction(search_start: date, search_stop: date) -> Optional[date]:
    """Find the date of inferior conjunction (elongation minimum, delta < 1.5 AU)."""
    venus_df, sun_df = _fetch_daily(search_start, search_stop)
    if venus_df.empty or sun_df.empty:
        return None

    n = min(len(venus_df), len(sun_df))
    v = venus_df.iloc[:n].reset_index(drop=True)
    s = sun_df.iloc[:n].reset_index(drop=True)

    elong = np.array([
        angular_separation(float(v.loc[i, "RA"]), float(v.loc[i, "DEC"]),
                           float(s.loc[i, "RA"]), float(s.loc[i, "DEC"]))
        for i in range(n)
    ])
    delta = v["delta"].astype(float).values

    best_date: Optional[date] = None
    best_elong = 999.0
    prev_conj = False

    for i in range(n):
        if elong[i] < 10.0 and delta[i] < 1.5:
            if not prev_conj:
                prev_conj = True
                best_elong = elong[i]
                dt_str = str(v.loc[i, "datetime_str"])
                best_date = _parse_horizons_date(dt_str)
            elif elong[i] < best_elong:
                best_elong = elong[i]
                dt_str = str(v.loc[i, "datetime_str"])
                best_date = _parse_horizons_date(dt_str)
        else:
            if prev_conj:
                break
            prev_conj = False

    return best_date


def find_superior_conjunction(search_start: date, search_stop: date) -> Optional[date]:
    """Find the date of superior conjunction (elongation minimum, delta > 1.5 AU)."""
    venus_df, sun_df = _fetch_daily(search_start, search_stop)
    if venus_df.empty or sun_df.empty:
        return None

    n = min(len(venus_df), len(sun_df))
    v = venus_df.iloc[:n].reset_index(drop=True)
    s = sun_df.iloc[:n].reset_index(drop=True)

    elong = np.array([
        angular_separation(float(v.loc[i, "RA"]), float(v.loc[i, "DEC"]),
                           float(s.loc[i, "RA"]), float(s.loc[i, "DEC"]))
        for i in range(n)
    ])
    delta = v["delta"].astype(float).values

    best_date: Optional[date] = None
    best_elong = 999.0
    prev_conj = False

    for i in range(n):
        if elong[i] < 10.0 and delta[i] >= 1.5:
            if not prev_conj:
                prev_conj = True
                best_elong = elong[i]
                dt_str = str(v.loc[i, "datetime_str"])
                best_date = _parse_horizons_date(dt_str)
            elif elong[i] < best_elong:
                best_elong = elong[i]
                dt_str = str(v.loc[i, "datetime_str"])
                best_date = _parse_horizons_date(dt_str)
        else:
            if prev_conj:
                break
            prev_conj = False

    return best_date


def find_retrograde_bounds(
    search_start: date, search_stop: date
) -> tuple[Optional[date], Optional[date]]:
    """Find retrograde start/end from the sign of day-over-day RA change.

    RA decreasing (delta_RA < 0) → retrograde motion.
    RA increasing (delta_RA > 0) → direct motion.
    Returns (retrograde_start_date, retrograde_end_date).
    """
    venus_df, _ = _fetch_daily(search_start, search_stop)
    if venus_df.empty:
        return None, None

    n = len(venus_df)
    v = venus_df.reset_index(drop=True)
    ra = v["RA"].astype(float).values

    # delta_RA in (-180, +180]: negative = retrograde, positive = direct
    delta_ra = np.array([(ra[i] - ra[i - 1] + 180) % 360 - 180 for i in range(1, n)])

    retro_start: Optional[date] = None
    retro_end: Optional[date] = None

    for i in range(len(delta_ra)):
        prev = delta_ra[i - 1] if i > 0 else delta_ra[0]
        curr = delta_ra[i]
        if np.isnan(prev) or np.isnan(curr):
            continue

        dt_str = str(v.loc[i + 1, "datetime_str"])
        d = _parse_horizons_date(dt_str)

        # Sign flip positive→negative: retrograde begins
        if prev > 0 and curr <= 0 and retro_start is None:
            retro_start = d
        # Sign flip negative→positive: retrograde ends
        elif prev <= 0 and curr > 0 and retro_start is not None and retro_end is None:
            retro_end = d

    return retro_start, retro_end


def find_greatest_elongation(
    search_start: date,
    search_stop: date,
    direction: str = "eastern",
) -> Optional[date]:
    """Find greatest elongation (local maximum) in the given direction.

    direction: "eastern" | "western"
    """
    venus_df, sun_df = _fetch_daily(search_start, search_stop)
    if venus_df.empty or sun_df.empty:
        return None

    n = min(len(venus_df), len(sun_df))
    v = venus_df.iloc[:n].reset_index(drop=True)
    s = sun_df.iloc[:n].reset_index(drop=True)

    elong = np.array([
        angular_separation(float(v.loc[i, "RA"]), float(v.loc[i, "DEC"]),
                           float(s.loc[i, "RA"]), float(s.loc[i, "DEC"]))
        for i in range(n)
    ])
    ra_diff = (v["RA"].astype(float).values - s["RA"].astype(float).values) % 360
    is_east = ra_diff < 180  # RA_venus - RA_sun < 180 → east (evening star)

    best_date: Optional[date] = None
    best_elong = 0.0

    for i in range(1, n - 1):
        if elong[i] > elong[i - 1] and elong[i] > elong[i + 1]:
            dir_matches = (direction == "eastern" and is_east[i]) or \
                          (direction == "western" and not is_east[i])
            if dir_matches and elong[i] > best_elong:
                best_elong = elong[i]
                dt_str = str(v.loc[i, "datetime_str"])
                best_date = _parse_horizons_date(dt_str)

    return best_date


# ---------------------------------------------------------------------------
# Phase assignment helper
# ---------------------------------------------------------------------------

def _assign_phase(
    month_start: date,
    inferior_conj: Optional[date],
    superior_conj: Optional[date],
    retrograde_start: Optional[date],
    retrograde_end: Optional[date],
    new_year: date,
) -> str:
    """Determine the Venus phase label for a month starting on *month_start*."""
    # Retrograde window takes precedence
    if retrograde_start and retrograde_end:
        if retrograde_start <= month_start <= retrograde_end:
            return PHASE_RETROGRADE

    # Near superior conjunction
    if superior_conj and abs((month_start - superior_conj).days) <= 22:
        return PHASE_SUPERIOR_CONJ

    # Before superior conjunction or after heliacal rise → morning star
    if superior_conj and month_start < superior_conj:
        return PHASE_MORNING_STAR

    return PHASE_EVENING_STAR


# ---------------------------------------------------------------------------
# Core builder
# ---------------------------------------------------------------------------

def build_calendar_year(
    new_year_date: date,
    year_number: int = 1,
    observer_lat: float = DEFAULT_LAT,
    observer_lon: float = DEFAULT_LON,
) -> VenusCalendarYear:
    """Build a complete VenusCalendarYear anchored to *new_year_date*.

    Lays out 13 months of 45 days, scans the 584-day window for key events,
    assigns phases, and constructs the holiday list.
    """
    end_date = new_year_date + timedelta(days=SYNODIC_DAYS - 1)
    scan_stop = new_year_date + timedelta(days=SYNODIC_DAYS + 30)

    log.info("Building Venus calendar year %d: %s → %s", year_number, new_year_date, end_date)

    # ------------------------------------------------------------------
    # Scan for key events
    # ------------------------------------------------------------------
    # Cycle order for a year starting at morning-star heliacal rise:
    #   1. Heliacal rise (new year)
    #   2. Morning star phase → Greatest Western Elongation (months 1–6)
    #   3. Superior conjunction (Venus behind Sun, ~months 6–7)
    #   4. Evening star phase → Greatest Eastern Elongation (months 7–11)
    #   5. Retrograde begins → Inferior conjunction → Retrograde ends (months 11–13)

    # Greatest Western Elongation: morning-star peak, first quarter of year
    gwe = find_greatest_elongation(
        new_year_date + timedelta(days=30),
        new_year_date + timedelta(days=280),
        "western",
    )

    # Superior conjunction: Venus behind Sun, mid-year (~days 200–420)
    superior_conj = find_superior_conjunction(
        new_year_date + timedelta(days=200),
        new_year_date + timedelta(days=420),
    )

    # Greatest Eastern Elongation: evening-star peak, second half of year (~days 300–520)
    gee = find_greatest_elongation(
        new_year_date + timedelta(days=300),
        new_year_date + timedelta(days=SYNODIC_DAYS),
        "eastern",
    )

    # Retrograde bounds: near end of year (~days 430 → SYNODIC_DAYS)
    retro_start, retro_end = find_retrograde_bounds(
        new_year_date + timedelta(days=430),
        new_year_date + timedelta(days=SYNODIC_DAYS + 30),
    )

    # Inferior conjunction: within retrograde window
    if retro_start:
        inf_search = retro_start - timedelta(days=5)
        inf_stop = retro_start + timedelta(days=60)
    else:
        inf_search = new_year_date + timedelta(days=480)
        inf_stop = new_year_date + timedelta(days=SYNODIC_DAYS + 30)
    inferior_conj = find_inferior_conjunction(inf_search, inf_stop)

    log.info(
        "Events — sup_conj=%s gee=%s retro=%s..%s inf_conj=%s gwe=%s",
        superior_conj, gee, retro_start, retro_end, inferior_conj, gwe,
    )

    # ------------------------------------------------------------------
    # Lay out 13 months × 45 days
    # ------------------------------------------------------------------
    months: list[VenusMonth] = []
    cursor = new_year_date
    for m in range(1, MONTHS_PER_YEAR + 1):
        month_days = DAYS_PER_MONTH
        # Month 7: absorb intercalary — 46 days so total = 585 ≈ synodic period
        if m == 7:
            month_days = 46
        m_start = cursor
        m_end = cursor + timedelta(days=month_days - 1)
        phase = _assign_phase(m_start, inferior_conj, superior_conj, retro_start, retro_end, new_year_date)
        months.append(VenusMonth(number=m, start_date=m_start, end_date=m_end, days=month_days, phase=phase))
        cursor = m_end + timedelta(days=1)

    # ------------------------------------------------------------------
    # Build holidays
    # ------------------------------------------------------------------
    holidays: list[VenusHoliday] = []

    def _to_venus_date(g: Optional[date]) -> tuple[int, int] | None:
        if g is None:
            return None
        result = gregorian_to_venus(g, months)
        return result

    def _add_holiday(name: str, g: Optional[date], desc: str) -> None:
        if g is None:
            return
        vd = _to_venus_date(g)
        if vd is None:
            return
        holidays.append(VenusHoliday(name=name, month=vd[0], day=vd[1], gregorian_date=g, description=desc))

    _add_holiday(HOLIDAY_NEW_YEAR, new_year_date,
                 "Heliacal rise — first morning visibility of Venus after inferior conjunction.")
    _add_holiday(HOLIDAY_GEE, gee,
                 "Venus reaches peak angular distance east of the Sun (evening star climax).")
    _add_holiday(HOLIDAY_RETRO_START, retro_start,
                 "Venus begins retrograde motion — RA rate crosses zero toward negative.")
    _add_holiday(HOLIDAY_INF_CONJ, inferior_conj,
                 "Venus passes between Earth and Sun — the New Moon of the Venus cycle.")
    _add_holiday(HOLIDAY_RETRO_END, retro_end,
                 "Venus resumes direct motion — RA rate crosses zero toward positive.")
    _add_holiday(HOLIDAY_GWE, gwe,
                 "Venus reaches peak angular distance west of the Sun (morning star climax).")
    _add_holiday(HOLIDAY_SUP_CONJ, superior_conj,
                 "Venus passes behind the Sun — the Full Moon of the Venus cycle.")

    # Intercalary Day: Month 7, Day 7 (fixed calendar position)
    if len(months) >= 7:
        intercalary_date = months[6].start_date + timedelta(days=6)  # day 7 (0-indexed: +6)
        holidays.append(VenusHoliday(
            name=HOLIDAY_INTERCALARY,
            month=7,
            day=7,
            gregorian_date=intercalary_date,
            description="Intercalary day — the 586th day absorbed into Month 7 to complete the synodic cycle.",
        ))

    holidays.sort(key=lambda h: h.gregorian_date)

    return VenusCalendarYear(
        year_number=year_number,
        new_year_date=new_year_date,
        end_date=end_date,
        months=months,
        holidays=holidays,
        inferior_conjunction=inferior_conj,
        superior_conjunction=superior_conj,
        greatest_eastern_elongation=gee,
        greatest_western_elongation=gwe,
        retrograde_start=retro_start,
        retrograde_end=retro_end,
    )


# ---------------------------------------------------------------------------
# Date conversion
# ---------------------------------------------------------------------------

def gregorian_to_venus(
    gregorian_date: date,
    months: list[VenusMonth],
) -> Optional[tuple[int, int]]:
    """Convert a Gregorian date to (venus_month, venus_day).

    Returns None if the date falls outside this calendar year.
    """
    for month in months:
        if month.start_date <= gregorian_date <= month.end_date:
            day = (gregorian_date - month.start_date).days + 1
            return (month.number, day)
    return None


# ---------------------------------------------------------------------------
# Today's Venus date
# ---------------------------------------------------------------------------

def today_in_venus_calendar(
    observer_lat: float = DEFAULT_LAT,
    observer_lon: float = DEFAULT_LON,
) -> dict:
    """Return today's date in the Venus calendar.

    Searches ±600 days from today to find the most recent heliacal rise,
    builds the calendar year, and converts today's date.
    Result is cached for 24 h (calendar does not change intraday).
    """
    from venustracker.cache import get_cache

    cache_key = f"venus_calendar:today:{observer_lat}:{observer_lon}"
    today_str = date.today().isoformat()
    full_key = f"{cache_key}:{today_str}"

    c = get_cache()
    if full_key in c:
        return c[full_key]  # type: ignore[return-value]

    result = _compute_today(observer_lat, observer_lon)
    c.set(full_key, result, expire=86_400)  # 24 h TTL
    return result


def _compute_today(observer_lat: float, observer_lon: float) -> dict:
    today = date.today()

    # Search backward up to 600 days to find the most recent heliacal rise
    # that is before or equal to today.
    new_year_date: Optional[date] = None
    year_number = 1

    # Known anchor: heliacal rise on 2025-03-18
    ANCHOR_NEW_YEAR = date(2025, 3, 18)
    ANCHOR_YEAR = 1

    # Walk synodic cycles to bracket today
    cycle_start = ANCHOR_NEW_YEAR
    cycle_year = ANCHOR_YEAR
    while cycle_start + timedelta(days=SYNODIC_DAYS) <= today:
        cycle_start += timedelta(days=SYNODIC_DAYS)
        cycle_year += 1

    # cycle_start should now be the most recent new year ≤ today
    # Refine by actually searching for the heliacal rise near that anchor
    search_from = cycle_start - timedelta(days=30)
    found = find_heliacal_rise(search_from, search_days=90)
    if found and found <= today:
        new_year_date = found
        year_number = cycle_year
    else:
        # Fall back to the previous cycle
        prev_start = cycle_start - timedelta(days=SYNODIC_DAYS)
        search_from2 = prev_start - timedelta(days=30)
        found2 = find_heliacal_rise(search_from2, search_days=90)
        if found2 and found2 <= today:
            new_year_date = found2
            year_number = cycle_year - 1
        else:
            new_year_date = cycle_start  # best-effort fallback
            year_number = cycle_year

    cal = build_calendar_year(new_year_date, year_number=year_number,
                              observer_lat=observer_lat, observer_lon=observer_lon)

    vd = gregorian_to_venus(today, cal.months)
    month_num, day_num = vd if vd else (0, 0)

    # Current phase
    phase = "Unknown"
    if vd:
        for m in cal.months:
            if m.number == month_num:
                phase = m.phase
                break

    # Next holiday (first holiday with gregorian_date > today)
    next_holiday = None
    for h in sorted(cal.holidays, key=lambda x: x.gregorian_date):
        if h.gregorian_date > today:
            next_holiday = h
            break

    # Next new year
    next_new_year = new_year_date + timedelta(days=SYNODIC_DAYS)

    return {
        "today": today.isoformat(),
        "venus_year": year_number,
        "venus_month": month_num,
        "venus_day": day_num,
        "phase": phase,
        "new_year_date": new_year_date.isoformat(),
        "next_new_year": next_new_year.isoformat(),
        "next_holiday_name": next_holiday.name if next_holiday else None,
        "next_holiday_date": next_holiday.gregorian_date.isoformat() if next_holiday else None,
        "next_holiday_days": (next_holiday.gregorian_date - today).days if next_holiday else None,
        "calendar_year": cal,
    }
