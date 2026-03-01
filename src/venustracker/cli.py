"""VenusTracker CLI — `vt` command."""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table
from rich import print as rprint

app = typer.Typer(
    name="vt",
    help="VenusTracker — astronomical data engine for Venus and the deep sky.",
    add_completion=False,
)
console = Console()

# ---------------------------------------------------------------------------
# Shared options
# ---------------------------------------------------------------------------

_lat_opt = typer.Option(0.0, "--lat", help="Observer latitude (decimal degrees).")
_lon_opt = typer.Option(0.0, "--lon", help="Observer longitude (decimal degrees).")


def _service(lat: float = 0.0, lon: float = 0.0):
    from venustracker.service import AstronomicalService
    return AstronomicalService(observer_lat=lat, observer_lon=lon)


# ---------------------------------------------------------------------------
# venus
# ---------------------------------------------------------------------------

@app.command("venus")
def venus(
    days: int = typer.Option(0, "--days", help="Show N-day ephemeris table (0 = current status only)."),
    lat: float = _lat_opt,
    lon: float = _lon_opt,
    events: bool = typer.Option(False, "--events", help="Show upcoming Venus events."),
):
    """Venus position, phase, and ephemeris."""
    svc = _service(lat, lon)

    if days == 0 and not events:
        _print_venus_status(svc)
    elif days > 0:
        _print_venus_ephemeris(svc, days)
    if events:
        _print_venus_events(svc)


def _print_venus_status(svc) -> None:
    with console.status("[bold cyan]Querying JPL Horizons…"):
        report = svc.venus_report()

    table = Table(title="Venus — Current Status", show_header=False, box=None)
    table.add_column("Field", style="cyan")
    table.add_column("Value", style="white")

    rows = [
        ("RA", report["ra_formatted"]),
        ("Dec", report["dec_formatted"]),
        ("Altitude", f"{report['altitude']:.2f}°"),
        ("Azimuth", f"{report['azimuth']:.2f}°"),
        ("Elongation from Sun", f"{report['elongation_deg']:.2f}°"),
        ("Morning/Evening", "Evening star" if report["is_evening_star"] else "Morning star"),
        ("Phase", report["phase_description"]),
        ("Illumination", f"{report['illumination_pct']:.1f}%"),
        ("Magnitude", f"{report['magnitude']:.2f}"),
        ("Distance (AU)", f"{report['distance_au']:.4f} AU"),
        ("Heliocentric dist.", f"{report['heliocentric_dist_au']:.4f} AU"),
    ]
    for field, value in rows:
        table.add_row(field, value)

    console.print(table)


def _print_venus_ephemeris(svc, days: int) -> None:
    with console.status(f"[bold cyan]Fetching {days}-day Venus ephemeris…"):
        df = svc.venus_ephemeris(days=days)

    if df.empty:
        console.print("[red]No ephemeris data returned.[/red]")
        raise typer.Exit(1)

    cols = ["datetime_str", "RA", "DEC", "delta", "r", "alpha", "illumination", "V"]
    available = [c for c in cols if c in df.columns]
    sub = df[available].copy()

    table = Table(title=f"Venus — {days}-day Ephemeris", show_lines=False)
    for col in available:
        table.add_column(col, style="white")

    for _, row in sub.iterrows():
        table.add_row(*[str(round(v, 4)) if isinstance(v, float) else str(v) for v in row])

    console.print(table)


def _print_venus_events(svc) -> None:
    with console.status("[bold cyan]Scanning for upcoming Venus events…"):
        evts = svc.venus_events(days=365)

    if not evts:
        console.print("[yellow]No significant events found in the next year.[/yellow]")
        return

    table = Table(title="Upcoming Venus Events")
    table.add_column("Event", style="cyan")
    table.add_column("Date", style="white")
    table.add_column("Elongation", style="yellow")
    table.add_column("Illumination", style="green")

    for e in evts:
        table.add_row(
            e["event"],
            e["date"][:10],
            f"{e['elongation_deg']:.1f}°",
            f"{e['illumination']:.1f}%",
        )

    console.print(table)


# ---------------------------------------------------------------------------
# stars
# ---------------------------------------------------------------------------

@app.command("stars")
def stars(
    ra: float = typer.Option(..., "--ra", help="RA centre (decimal degrees)."),
    dec: float = typer.Option(..., "--dec", help="Dec centre (decimal degrees)."),
    radius: float = typer.Option(1.0, "--radius", help="Search radius (degrees)."),
    mag: Optional[float] = typer.Option(None, "--mag", help="Magnitude limit (Vmag)."),
    catalogue: str = typer.Option("hipparcos", "--cat", help="hipparcos | tycho2 | both"),
):
    """Cone search star catalogues (Hipparcos / Tycho-2)."""
    svc = _service()

    with console.status("[bold cyan]Querying VizieR…"):
        if catalogue in ("hipparcos", "both"):
            hip = svc.query_hipparcos(ra, dec, radius, mag_limit=mag)
            _print_star_table(hip, title=f"Hipparcos stars within {radius}° of ({ra:.2f}, {dec:.2f})")
        if catalogue in ("tycho2", "both"):
            tyc = svc.query_tycho2(ra, dec, min(radius, 0.5), mag_limit=mag)
            _print_star_table(tyc, title=f"Tycho-2 stars within {min(radius,0.5)}° of ({ra:.2f}, {dec:.2f})")


def _print_star_table(df, title: str) -> None:
    if df.empty:
        console.print(f"[yellow]{title}: no results.[/yellow]")
        return
    table = Table(title=title)
    for col in df.columns[:8]:
        table.add_column(str(col))
    for _, row in df.head(20).iterrows():
        table.add_row(*[str(v)[:14] for v in row[:8]])
    if len(df) > 20:
        console.print(f"[dim]… and {len(df) - 20} more rows.[/dim]")
    console.print(table)


# ---------------------------------------------------------------------------
# galaxies
# ---------------------------------------------------------------------------

@app.command("galaxies")
def galaxies(
    ra: float = typer.Option(..., "--ra", help="RA centre (decimal degrees)."),
    dec: float = typer.Option(..., "--dec", help="Dec centre (decimal degrees)."),
    radius: float = typer.Option(1.0, "--radius", help="Search radius (degrees)."),
):
    """Cone search the PGC galaxy catalogue."""
    svc = _service()
    with console.status("[bold cyan]Querying VizieR PGC…"):
        df = svc.query_galaxies(ra, dec, radius)

    if df.empty:
        console.print("[yellow]No galaxies found in that region.[/yellow]")
        raise typer.Exit()

    table = Table(title=f"PGC galaxies within {radius}° of ({ra:.2f}, {dec:.2f})")
    for col in df.columns[:8]:
        table.add_column(str(col))
    for _, row in df.head(30).iterrows():
        table.add_row(*[str(v)[:14] for v in row[:8]])
    if len(df) > 30:
        console.print(f"[dim]… and {len(df) - 30} more rows.[/dim]")
    console.print(table)


# ---------------------------------------------------------------------------
# comets
# ---------------------------------------------------------------------------

@app.command("comets")
def comets(
    comet: Optional[str] = typer.Option(None, "--comet", help="Filter by comet designation."),
    limit: int = typer.Option(20, "--limit", help="Number of observations to show."),
):
    """Show recent comet observations from COBS."""
    svc = _service()
    with console.status("[bold cyan]Fetching COBS observations…"):
        df = svc.query_comets(comet=comet, limit=limit)

    if df.empty:
        console.print("[yellow]No comet observations found.[/yellow]")
        raise typer.Exit()

    table = Table(title="Recent Comet Observations (COBS)")
    for col in df.columns[:8]:
        table.add_column(str(col))
    for _, row in df.head(limit).iterrows():
        table.add_row(*[str(v)[:20] for v in row[:8]])
    console.print(table)


# ---------------------------------------------------------------------------
# sky-image
# ---------------------------------------------------------------------------

@app.command("sky-image")
def sky_image(
    ra: float = typer.Option(..., "--ra", help="RA centre (decimal degrees)."),
    dec: float = typer.Option(..., "--dec", help="Dec centre (decimal degrees)."),
    fov: float = typer.Option(0.5, "--fov", help="Field of view in degrees."),
    survey: str = typer.Option("DSS2 Red", "--survey", help="SkyView survey name."),
):
    """Download a DSS FITS image + PNG preview for a sky region."""
    svc = _service()
    with console.status(f"[bold cyan]Fetching DSS image ({survey})…"):
        try:
            fits_path = svc.get_sky_image(ra, dec, fov_deg=fov, survey=survey)
        except Exception as exc:
            console.print(f"[red]Error: {exc}[/red]")
            raise typer.Exit(1)

    png_path = fits_path.with_suffix(".png")
    console.print(f"[green]FITS:[/green] {fits_path}")
    if png_path.exists():
        console.print(f"[green]PNG:[/green]  {png_path}")


# ---------------------------------------------------------------------------
# snapshot
# ---------------------------------------------------------------------------

@app.command("snapshot")
def snapshot(
    ra: float = typer.Option(..., "--ra", help="RA centre (decimal degrees)."),
    dec: float = typer.Option(..., "--dec", help="Dec centre (decimal degrees)."),
    radius: float = typer.Option(1.0, "--radius", help="Search radius (degrees)."),
    lat: float = _lat_opt,
    lon: float = _lon_opt,
    no_image: bool = typer.Option(False, "--no-image", help="Skip DSS image download."),
):
    """Full sky snapshot — stars, galaxies, Venus, and DSS image."""
    svc = _service(lat, lon)
    with console.status("[bold cyan]Building sky snapshot (all datasets)…"):
        snap = svc.sky_snapshot(ra, dec, radius_deg=radius, include_dss=not no_image)

    console.rule("[bold]Sky Snapshot")
    console.print(f"Centre: RA={ra:.4f}°  Dec={dec:.4f}°  r={radius:.2f}°\n")

    console.print(f"[cyan]Hipparcos stars:[/cyan]  {len(snap.hipparcos)}")
    console.print(f"[cyan]Tycho-2 stars:[/cyan]   {len(snap.tycho2)}")
    console.print(f"[cyan]PGC galaxies:[/cyan]    {len(snap.galaxies)}")

    if snap.venus_status:
        vs = snap.venus_status
        console.print(
            f"\n[yellow]Venus:[/yellow] {vs.position.ra:.4f}° / {vs.position.dec:.4f}°  "
            f"elong={vs.elongation:.1f}°  ill={vs.illumination:.1f}%  mag={vs.magnitude:.2f}"
        )
        console.print(f"  Phase: {vs.phase_desc}")

    if snap.dss_fits_path:
        console.print(f"\n[green]DSS FITS:[/green] {snap.dss_fits_path}")
        png = snap.dss_fits_path.with_suffix(".png")
        if png.exists():
            console.print(f"[green]DSS PNG: [/green] {png}")


# ---------------------------------------------------------------------------
# calendar
# ---------------------------------------------------------------------------

calendar_app = typer.Typer(help="Venus synodic calendar — 13 months × 45 days.")
app.add_typer(calendar_app, name="calendar")


@calendar_app.callback(invoke_without_command=True)
def calendar_cmd(
    ctx: typer.Context,
    year: Optional[int] = typer.Option(None, "--year", help="Show full Venus year containing this Gregorian year."),
    month: Optional[int] = typer.Option(None, "--month", help="Show details for Venus Month N in the current year."),
    holidays: bool = typer.Option(False, "--holidays", help="List all holidays in the current Venus year."),
    next_year: bool = typer.Option(False, "--next-year", help="Show when the next Venus New Year begins."),
    lat: float = _lat_opt,
    lon: float = _lon_opt,
):
    """Venus synodic calendar — today's date, phases, and upcoming holidays."""
    if ctx.invoked_subcommand is not None:
        return

    svc = _service(lat, lon)

    if year is not None:
        _print_calendar_year(svc, year)
        return

    with console.status("[bold cyan]Computing Venus calendar…"):
        data = svc.calendar_today()

    cal = data["calendar_year"]

    if holidays:
        _print_holidays(cal)
        return

    if month is not None:
        _print_month(cal, month)
        return

    if next_year:
        from datetime import date, timedelta
        from venustracker.core.calendar import SYNODIC_DAYS
        ny = date.fromisoformat(data["new_year_date"])
        next_ny = ny + timedelta(days=SYNODIC_DAYS)
        days_away = (next_ny - date.today()).days
        console.print(f"[bold]Next Venus New Year:[/bold] {next_ny.strftime('%B %-d, %Y')}  ({days_away} days from today)")
        return

    # Default: show today's Venus date
    _print_today(data)


def _print_today(data: dict) -> None:
    from datetime import date

    today = date.fromisoformat(data["today"])
    new_year = date.fromisoformat(data["new_year_date"])
    next_ny = date.fromisoformat(data["next_new_year"])

    table = Table(title="Venus Calendar — Today", show_header=False, box=None)
    table.add_column("Field", style="cyan", min_width=20)
    table.add_column("Value", style="white")

    table.add_row("Gregorian", today.strftime("%B %-d, %Y"))
    table.add_row(
        "Venus Date",
        f"Year {data['venus_year']}, Month {data['venus_month']}, Day {data['venus_day']}",
    )
    table.add_row("Phase", data["phase"])

    if data["next_holiday_name"]:
        h_date = date.fromisoformat(data["next_holiday_date"])
        table.add_row(
            "Next Holiday",
            f"{data['next_holiday_name']} — in {data['next_holiday_days']} days"
            f" ({h_date.strftime('%B %-d, %Y')})",
        )

    table.add_row(
        "New Year",
        f"Began {new_year.strftime('%B %-d, %Y')} · Next ~{next_ny.strftime('%B %-d, %Y')}",
    )

    console.print(table)


def _print_calendar_year(svc, gregorian_year: int) -> None:
    with console.status(f"[bold cyan]Building Venus calendar for {gregorian_year}…"):
        cal = svc.calendar_year(gregorian_year)

    title = (
        f"Venus Calendar Year {cal.year_number} "
        f"({cal.new_year_date.strftime('%B %-d, %Y')} → {cal.end_date.strftime('%B %-d, %Y')})"
    )
    table = Table(title=title, show_lines=True)
    table.add_column("Month", style="cyan", min_width=8)
    table.add_column("Start (Gregorian)", style="white")
    table.add_column("End (Gregorian)", style="white")
    table.add_column("Phase", style="yellow")
    table.add_column("Holiday", style="green")

    holiday_by_month: dict[int, list[str]] = {}
    for h in cal.holidays:
        holiday_by_month.setdefault(h.month, []).append(f"★ {h.name}")

    for m in cal.months:
        h_labels = "  ".join(holiday_by_month.get(m.number, []))
        table.add_row(
            f"Month {m.number}",
            m.start_date.strftime("%B %-d, %Y"),
            m.end_date.strftime("%B %-d, %Y"),
            m.phase,
            h_labels,
        )

    console.print(table)
    _print_key_events(cal)


def _print_holidays(cal) -> None:
    table = Table(title=f"Venus Year {cal.year_number} — Holidays", show_lines=False)
    table.add_column("#", style="cyan", min_width=3)
    table.add_column("Holiday", style="white")
    table.add_column("Venus Date", style="yellow")
    table.add_column("Gregorian Date", style="green")

    for i, h in enumerate(cal.holidays, 1):
        table.add_row(
            str(i),
            h.name,
            f"Month {h.month}, Day {h.day}",
            h.gregorian_date.strftime("%B %-d, %Y"),
        )

    console.print(table)


def _print_month(cal, month_num: int) -> None:
    months = [m for m in cal.months if m.number == month_num]
    if not months:
        console.print(f"[red]Month {month_num} not found in calendar year {cal.year_number}.[/red]")
        raise typer.Exit(1)
    m = months[0]

    console.print(f"\n[bold cyan]Venus Year {cal.year_number} — Month {m.number}[/bold cyan]")
    console.print(f"  Gregorian: {m.start_date.strftime('%B %-d, %Y')} → {m.end_date.strftime('%B %-d, %Y')}")
    console.print(f"  Phase:     {m.phase}")
    console.print(f"  Days:      {m.days}")

    month_holidays = [h for h in cal.holidays if h.month == month_num]
    if month_holidays:
        console.print("\n  [green]Holidays this month:[/green]")
        for h in month_holidays:
            console.print(f"    Day {h.day:2d} — {h.name}  ({h.gregorian_date.strftime('%B %-d, %Y')})")


def _print_key_events(cal) -> None:
    console.print("\n[bold]Key Astronomical Events[/bold]")
    events = [
        ("Superior Conjunction", cal.superior_conjunction),
        ("Greatest Eastern Elongation", cal.greatest_eastern_elongation),
        ("Retrograde Begins", cal.retrograde_start),
        ("Inferior Conjunction", cal.inferior_conjunction),
        ("Retrograde Ends", cal.retrograde_end),
        ("Greatest Western Elongation", cal.greatest_western_elongation),
    ]
    for name, d in events:
        val = d.strftime("%B %-d, %Y") if d else "[dim]not found[/dim]"
        console.print(f"  [cyan]{name}:[/cyan] {val}")


# ---------------------------------------------------------------------------
# cache
# ---------------------------------------------------------------------------

cache_app = typer.Typer(help="Manage the local data cache.")
app.add_typer(cache_app, name="cache")


@cache_app.command("clear")
def cache_clear():
    """Delete all locally cached data."""
    from venustracker.cache import clear_cache
    n = clear_cache()
    console.print(f"[green]Cleared {n} cached entries.[/green]")


@cache_app.command("info")
def cache_info_cmd():
    """Show cache size and location."""
    from venustracker.cache import cache_info
    info = cache_info()
    console.print(f"Directory: {info['directory']}")
    console.print(f"Items:     {info['items']}")
    console.print(f"Size:      {info['size_bytes'] / 1024:.1f} KiB")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s")
    app()


if __name__ == "__main__":
    main()
