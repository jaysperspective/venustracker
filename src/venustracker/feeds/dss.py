"""DSS / SkyView feed — Digitized Sky Survey imagery via astroquery."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from astropy import units as u
from astropy.coordinates import SkyCoord
from astropy.io import fits
from astroquery.skyview import SkyView

from venustracker.config import DATA_DIR, DEFAULT_DSS_SURVEY, DEFAULT_FOV_DEG, DSS_SURVEYS

log = logging.getLogger(__name__)

_IMG_DIR = DATA_DIR / "images"
_IMG_DIR.mkdir(parents=True, exist_ok=True)


def get_image(
    ra: float,
    dec: float,
    fov_deg: float = DEFAULT_FOV_DEG,
    survey: str = DEFAULT_DSS_SURVEY,
    save_path: Optional[Path] = None,
) -> Path:
    """Download a DSS image from SkyView and save as FITS + PNG preview.

    Parameters
    ----------
    ra / dec:
        Centre coordinate in decimal degrees (J2000).
    fov_deg:
        Field of view in degrees (square).
    survey:
        SkyView survey name. Must be one of ``DSS_SURVEYS``.
    save_path:
        Destination directory; defaults to ``~/.venustracker/images/``.

    Returns
    -------
    Path to the saved FITS file.
    """
    if survey not in DSS_SURVEYS:
        raise ValueError(f"survey must be one of {DSS_SURVEYS}, got {survey!r}")

    dest = Path(save_path) if save_path else _IMG_DIR
    dest.mkdir(parents=True, exist_ok=True)

    coord = SkyCoord(ra=ra * u.deg, dec=dec * u.deg, frame="icrs")
    safe_survey = survey.replace(" ", "_")
    fits_path = dest / f"dss_{ra:.4f}_{dec:.4f}_{safe_survey}.fits"
    png_path = dest / f"dss_{ra:.4f}_{dec:.4f}_{safe_survey}.png"

    if fits_path.exists():
        log.debug("DSS cache hit (file): %s", fits_path)
        return fits_path

    log.debug("SkyView query: survey=%s coord=(%.4f, %.4f) fov=%.2f°", survey, ra, dec, fov_deg)
    images = SkyView.get_images(
        position=coord,
        survey=[survey],
        radius=fov_deg * u.deg,
    )

    if not images:
        raise RuntimeError(f"SkyView returned no images for survey={survey!r}")

    hdu = images[0][0]
    hdu.writeto(str(fits_path), overwrite=True)
    log.info("FITS saved: %s", fits_path)

    _save_png_preview(hdu, png_path)
    return fits_path


def _save_png_preview(hdu: fits.PrimaryHDU, path: Path) -> None:
    """Convert a FITS image HDU to a normalised greyscale PNG."""
    try:
        import numpy as np
        from PIL import Image

        data = hdu.data.astype(float)
        lo, hi = np.percentile(data, [1, 99])
        data = np.clip((data - lo) / max(hi - lo, 1e-9), 0, 1)
        img = Image.fromarray((data * 255).astype(np.uint8), mode="L")
        img.save(str(path))
        log.info("PNG preview saved: %s", path)
    except Exception as exc:
        log.warning("PNG preview failed: %s", exc)
