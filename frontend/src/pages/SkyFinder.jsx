import { useState, useEffect, useRef } from 'react'

const GOLD      = '#c8b870'
const GOLD_DIM  = 'rgba(200,184,112,0.3)'
const BG        = '#1a1a14'
const CREAM     = 'rgba(245,240,232,0.88)'
const CREAM_DIM = 'rgba(245,240,232,0.45)'
const MOON_C    = 'rgba(220,215,200,0.9)'
const MOON_DIM  = 'rgba(220,215,200,0.35)'
const SUN_C     = '#f0c040'

// ─── FOV constants (portrait phone) ──────────────────────────────────────────

const H_FOV_HALF = 27  // degrees half horizontal FOV (54° total)
const V_FOV_HALF = 36  // degrees half vertical FOV  (72° total)

// ─── Zodiac constellations (center RA/Dec) ────────────────────────────────────

const CONSTELLATIONS = [
  { name: 'Aries',       ra:  39.50, dec: +20.0 },
  { name: 'Taurus',      ra:  70.50, dec: +15.0 },
  { name: 'Gemini',      ra: 107.00, dec: +23.0 },
  { name: 'Cancer',      ra: 127.50, dec: +20.0 },
  { name: 'Leo',         ra: 160.00, dec: +15.0 },
  { name: 'Virgo',       ra: 200.80, dec:  -3.0 },
  { name: 'Libra',       ra: 228.00, dec: -15.0 },
  { name: 'Scorpius',    ra: 255.00, dec: -30.0 },
  { name: 'Sagittarius', ra: 286.50, dec: -25.0 },
  { name: 'Capricornus', ra: 315.80, dec: -18.0 },
  { name: 'Aquarius',    ra: 334.00, dec: -10.0 },
  { name: 'Pisces',      ra:  18.75, dec: +15.0 },
]

// ─── Bright star catalog (~55 stars) ─────────────────────────────────────────

const STARS = [
  { name: 'Sirius',      ra: 101.287, dec: -16.716, mag: -1.46 },
  { name: 'Canopus',     ra:  95.988, dec: -52.696, mag: -0.74 },
  { name: 'Arcturus',    ra: 213.915, dec:  19.182, mag: -0.05 },
  { name: 'Vega',        ra: 279.235, dec:  38.784, mag:  0.03 },
  { name: 'Capella',     ra:  79.172, dec:  45.998, mag:  0.08 },
  { name: 'Rigel',       ra:  78.634, dec:  -8.202, mag:  0.13 },
  { name: 'Procyon',     ra: 114.827, dec:   5.225, mag:  0.34 },
  { name: 'Betelgeuse',  ra:  88.793, dec:   7.407, mag:  0.42 },
  { name: 'Achernar',    ra:  24.429, dec: -57.237, mag:  0.46 },
  { name: 'Hadar',       ra: 210.956, dec: -60.373, mag:  0.61 },
  { name: 'Altair',      ra: 297.696, dec:   8.868, mag:  0.77 },
  { name: 'Acrux',       ra: 186.650, dec: -63.099, mag:  0.77 },
  { name: 'Aldebaran',   ra:  68.980, dec:  16.509, mag:  0.85 },
  { name: 'Antares',     ra: 247.352, dec: -26.432, mag:  0.96 },
  { name: 'Spica',       ra: 201.298, dec: -11.161, mag:  1.04 },
  { name: 'Pollux',      ra: 116.329, dec:  28.026, mag:  1.14 },
  { name: 'Fomalhaut',   ra: 344.413, dec: -29.622, mag:  1.16 },
  { name: 'Deneb',       ra: 310.358, dec:  45.280, mag:  1.25 },
  { name: 'Mimosa',      ra: 191.930, dec: -59.689, mag:  1.25 },
  { name: 'Regulus',     ra: 152.093, dec:  11.967, mag:  1.35 },
  { name: 'Adhara',      ra: 104.656, dec: -28.972, mag:  1.50 },
  { name: 'Castor',      ra: 113.650, dec:  31.888, mag:  1.58 },
  { name: 'Gacrux',      ra: 187.791, dec: -57.113, mag:  1.63 },
  { name: 'Shaula',      ra: 263.402, dec: -37.104, mag:  1.63 },
  { name: 'Bellatrix',   ra:  81.283, dec:   6.350, mag:  1.64 },
  { name: 'Elnath',      ra:  81.573, dec:  28.608, mag:  1.65 },
  { name: 'Miaplacidus', ra: 138.300, dec: -69.717, mag:  1.68 },
  { name: 'Alnilam',     ra:  84.053, dec:  -1.202, mag:  1.69 },
  { name: 'Alnair',      ra: 332.058, dec: -46.961, mag:  1.74 },
  { name: 'Alnitak',     ra:  85.190, dec:  -1.943, mag:  1.77 },
  { name: 'Alioth',      ra: 193.507, dec:  55.960, mag:  1.77 },
  { name: 'Dubhe',       ra: 165.932, dec:  61.751, mag:  1.79 },
  { name: 'Mirfak',      ra:  51.081, dec:  49.861, mag:  1.80 },
  { name: 'Kaus Aust.',  ra: 276.043, dec: -34.384, mag:  1.80 },
  { name: 'Wezen',       ra: 107.098, dec: -26.393, mag:  1.84 },
  { name: 'Alkaid',      ra: 206.885, dec:  49.313, mag:  1.86 },
  { name: 'Sargas',      ra: 264.330, dec: -42.998, mag:  1.87 },
  { name: 'Avior',       ra: 125.629, dec: -59.509, mag:  1.86 },
  { name: 'Menkalinan',  ra:  89.882, dec:  44.948, mag:  1.90 },
  { name: 'Atria',       ra: 252.166, dec: -69.028, mag:  1.92 },
  { name: 'Alhena',      ra:  99.428, dec:  16.399, mag:  1.93 },
  { name: 'Peacock',     ra: 306.412, dec: -56.735, mag:  1.94 },
  { name: 'Polaris',     ra:  37.954, dec:  89.264, mag:  1.98 },
  { name: 'Mirzam',      ra:  95.675, dec: -17.956, mag:  1.98 },
  { name: 'Alphard',     ra: 141.897, dec:  -8.659, mag:  1.98 },
  { name: 'Hamal',       ra:  31.793, dec:  23.463, mag:  2.00 },
  { name: 'Diphda',      ra:  10.897, dec: -17.987, mag:  2.02 },
  { name: 'Nunki',       ra: 283.816, dec: -26.297, mag:  2.02 },
  { name: 'Menkent',     ra: 211.671, dec: -36.370, mag:  2.06 },
  { name: 'Saiph',       ra:  86.939, dec:  -9.670, mag:  2.09 },
  { name: 'Alpheratz',   ra:   2.097, dec:  29.091, mag:  2.06 },
  { name: 'Mirach',      ra:  17.433, dec:  35.621, mag:  2.05 },
  { name: 'Kochab',      ra: 222.677, dec:  74.155, mag:  2.08 },
  { name: 'Rasalhague',  ra: 263.734, dec:  12.560, mag:  2.08 },
  { name: 'Mintaka',     ra:  83.002, dec:  -0.299, mag:  2.25 },
  { name: 'Merak',       ra: 165.460, dec:  56.383, mag:  2.37 },
]

// ─── Constellation lines (star name pairs) ──────────────────────────────────

const CONSTELLATION_LINES = [
  // Orion
  ['Betelgeuse', 'Bellatrix'],
  ['Betelgeuse', 'Alnilam'],
  ['Bellatrix', 'Alnilam'],
  ['Alnilam', 'Alnitak'],
  ['Alnilam', 'Mintaka'],
  ['Alnitak', 'Saiph'],
  ['Mintaka', 'Rigel'],
  ['Betelgeuse', 'Saiph'],
  ['Bellatrix', 'Rigel'],
  // Gemini
  ['Castor', 'Pollux'],
  ['Castor', 'Alhena'],
  ['Pollux', 'Alhena'],
  // Taurus
  ['Aldebaran', 'Elnath'],
  // Ursa Major (Big Dipper)
  ['Dubhe', 'Merak'],
  ['Dubhe', 'Alioth'],
  ['Alioth', 'Alkaid'],
  ['Merak', 'Alioth'],
  // Leo
  ['Regulus', 'Deneb'],
  // Scorpius
  ['Antares', 'Shaula'],
  ['Antares', 'Sargas'],
  // Canis Major
  ['Sirius', 'Adhara'],
  ['Sirius', 'Mirzam'],
  ['Sirius', 'Wezen'],
  ['Adhara', 'Wezen'],
]

// Build a lookup for fast star-name → index mapping
const STAR_INDEX = {}
STARS.forEach((s, i) => { STAR_INDEX[s.name] = i })

// ─── Haptics helper ─────────────────────────────────────────────────────────

async function triggerHaptic() {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {})
  } catch { /* not installed or browser */ }
}

// ─── Client-side RA/Dec → Az/Alt ─────────────────────────────────────────────

function raDecToAzAlt(ra, dec, lat, lon) {
  const now = new Date()
  const JD = now.getTime() / 86400000 + 2440587.5
  const JD0 = Math.floor(JD - 0.5) + 0.5
  const T0 = (JD0 - 2451545.0) / 36525
  const UT = (JD - JD0) * 24
  const GMST_h = 6.697374558 + 2400.0513369 * T0 + 0.0000258622 * T0 * T0 + UT * 1.00273790935
  const LST = ((GMST_h * 15 + lon) % 360 + 360) % 360
  const HA = ((LST - ra) % 360 + 360) % 360
  const hRad = HA  * Math.PI / 180
  const dRad = dec * Math.PI / 180
  const lRad = lat * Math.PI / 180
  const sinAlt = Math.sin(dRad) * Math.sin(lRad) + Math.cos(dRad) * Math.cos(lRad) * Math.cos(hRad)
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)))
  const alt = altRad * 180 / Math.PI
  const cosAltRad = Math.cos(altRad)
  if (Math.abs(cosAltRad) < 1e-6) return { az: 0, alt }
  const cosAz = (Math.sin(dRad) - Math.sin(lRad) * sinAlt) / (Math.cos(lRad) * cosAltRad)
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI
  if (Math.sin(hRad) > 0) az = 360 - az
  return { az, alt }
}

// ─── Permission screen ────────────────────────────────────────────────────────

function PermissionScreen({ onRequest, state }) {
  const isUnavailable = state === 'unavailable'
  const isDenied      = state === 'denied'

  return (
    <div style={{
      background: BG,
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 32px',
      paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
      textAlign: 'center',
    }}>
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ marginBottom: 28 }}>
        <circle cx="36" cy="36" r="33" stroke={GOLD} strokeWidth="1.5" fill="none" opacity="0.45" />
        <path d="M36 11 L39.5 33 L36 30 L32.5 33 Z" fill={GOLD} opacity="0.95" />
        <path d="M36 61 L39.5 39 L36 42 L32.5 39 Z" fill={CREAM_DIM} />
        <circle cx="36" cy="36" r="3.5" fill={GOLD} />
      </svg>

      <h2 style={{
        fontFamily: 'Georgia, serif',
        color: CREAM,
        fontSize: '1.2rem',
        fontWeight: 'normal',
        marginBottom: 10,
        letterSpacing: '0.03em',
      }}>
        {isUnavailable ? 'Not Available' : isDenied ? 'Access Denied' : 'Sky Finder'}
      </h2>

      <p style={{
        color: CREAM_DIM,
        fontSize: '0.88rem',
        lineHeight: 1.65,
        marginBottom: 36,
        maxWidth: 280,
      }}>
        {isUnavailable
          ? 'This device does not support the orientation sensor needed for Sky Finder.'
          : isDenied
          ? 'Compass access was denied. Go to Settings → Safari → Motion & Orientation Access and reload.'
          : 'Point your phone at the sky to locate Venus. Requires access to the compass and gyroscope.'}
      </p>

      {onRequest && (
        <button
          onClick={onRequest}
          style={{
            background: GOLD,
            color: '#1a1a14',
            border: 'none',
            borderRadius: 12,
            padding: '14px 40px',
            fontSize: '0.92rem',
            fontFamily: 'Georgia, serif',
            fontWeight: 600,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Enable Compass
        </button>
      )}
    </div>
  )
}

// ─── Calibration screen ──────────────────────────────────────────────────────

function CalibrationScreen({ videoRef, cameraError, moonData, sunData, onCalibrate }) {
  const moonAbove = moonData?.altitude != null ? moonData.altitude > 0 : null
  const sunAbove  = sunData?.altitude  != null ? sunData.altitude  > 0 : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#080806' }}>
      {/* Camera feed */}
      {!cameraError && (
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      {cameraError && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '0.78rem', color: CREAM_DIM, fontFamily: 'Georgia, serif', textAlign: 'center', padding: '0 24px' }}>
            Camera unavailable — the sky will still calibrate from your compass heading.
          </span>
        </div>
      )}

      {/* Crosshair overlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: GOLD, opacity: 0.5, transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: GOLD, opacity: 0.5, transform: 'translateX(-50%)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${GOLD}`, opacity: 0.6, transform: 'translate(-50%, -50%)' }} />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingLeft: 20, paddingRight: 20, paddingBottom: 30,
        background: 'linear-gradient(to bottom, rgba(8,8,6,0.85) 0%, rgba(8,8,6,0.5) 70%, transparent 100%)',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: 'Georgia, serif', fontWeight: 'normal',
          color: CREAM, fontSize: '1.15rem', letterSpacing: '0.04em', marginBottom: 8,
        }}>
          Calibrate Sky
        </h2>
        <p style={{
          color: CREAM_DIM, fontSize: '0.82rem', lineHeight: 1.6, maxWidth: 300, margin: '0 auto',
        }}>
          Point the crosshairs at the Moon or Sun, then tap the matching button below.
        </p>
      </div>

      {/* Buttons — always show both */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        paddingBottom: 'max(30px, env(safe-area-inset-bottom))',
        paddingTop: 20,
        background: 'linear-gradient(to top, rgba(8,8,6,0.85) 0%, rgba(8,8,6,0.5) 70%, transparent 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => onCalibrate('moon')}
              style={{
                background: 'rgba(220,215,200,0.12)',
                border: `1.5px solid ${MOON_C}`,
                borderRadius: 28, padding: '14px 32px',
                color: MOON_C, fontSize: '0.88rem',
                fontFamily: 'Georgia, serif', fontWeight: 600,
                letterSpacing: '0.05em', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Moon
            </button>
            {moonAbove != null && (
              <span style={{ fontSize: '0.62rem', color: moonAbove ? 'rgba(120,200,120,0.8)' : CREAM_DIM }}>
                {moonAbove ? 'Above horizon' : 'Below horizon'}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => onCalibrate('sun')}
              style={{
                background: 'rgba(240,192,64,0.1)',
                border: `1.5px solid ${SUN_C}`,
                borderRadius: 28, padding: '14px 32px',
                color: SUN_C, fontSize: '0.88rem',
                fontFamily: 'Georgia, serif', fontWeight: 600,
                letterSpacing: '0.05em', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Sun
            </button>
            {sunAbove != null && (
              <span style={{ fontSize: '0.62rem', color: sunAbove ? 'rgba(120,200,120,0.8)' : CREAM_DIM }}>
                {sunAbove ? 'Above horizon' : 'Below horizon'}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onCalibrate('skip')}
          style={{
            background: 'transparent', border: 'none',
            color: CREAM_DIM, fontSize: '0.75rem',
            fontFamily: 'Georgia, serif', letterSpacing: '0.04em',
            cursor: 'pointer', padding: '6px 16px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Skip — use compass only
        </button>
      </div>
    </div>
  )
}

// ─── Elevation bar ────────────────────────────────────────────────────────────

function ElevationBar({ venusAlt, deviceElevation }) {
  const MIN = -10, MAX = 90
  const range = MAX - MIN
  const vPct = Math.max(2, Math.min(98, ((venusAlt - MIN) / range) * 100))
  const dPct = Math.max(2, Math.min(98, ((deviceElevation - MIN) / range) * 100))

  return (
    <div style={{ width: '100%', padding: '0 4px' }}>
      <div style={{
        fontSize: '0.62rem',
        color: CREAM_DIM,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 10,
        textAlign: 'center',
      }}>
        Elevation
      </div>

      <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: `${dPct}%`, height: '100%',
          background: 'rgba(200,184,112,0.15)', borderRadius: 3,
        }} />
        <div style={{
          position: 'absolute',
          left: `${vPct}%`, top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 20, height: 20, borderRadius: '50%',
          background: GOLD,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#1a1a14', fontWeight: 600, zIndex: 2,
        }}>
          ♀
        </div>
        <div style={{
          position: 'absolute',
          left: `${dPct}%`, top: -4,
          transform: 'translateX(-50%)',
          width: 2, height: 14,
          background: CREAM, borderRadius: 1, opacity: 0.6, zIndex: 1,
        }} />
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 8, fontSize: '0.62rem', color: CREAM_DIM,
      }}>
        <span>{MIN}°</span>
        <span style={{ color: GOLD }}>♀ {venusAlt.toFixed(1)}°</span>
        <span>{MAX}°</span>
      </div>
    </div>
  )
}

// ─── Compass view ─────────────────────────────────────────────────────────────

function CompassView({
  alphaRaw, alpha,
  venusAz, venusAlt, deviceElevation, azDiff, compassAccuracy,
  compassOffset, moonAz, moonAlt,
}) {
  const CX = 150, CY = 150
  const RING_R = 126

  const groupRef    = useRef(null)
  const smoothAngle = useRef(alpha)

  useEffect(() => {
    let raf
    const animate = () => {
      const target = (alphaRaw.current + compassOffset.current + 360) % 360
      const curr   = smoothAngle.current
      const diff   = ((target - curr + 540) % 360) - 180
      smoothAngle.current = curr + diff * 0.14
      if (groupRef.current) {
        groupRef.current.setAttribute('transform', `rotate(${-smoothAngle.current}, ${CX}, ${CY})`)
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [alphaRaw, compassOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  const venusRad = ((venusAz - 90) * Math.PI) / 180
  const vx = CX + (RING_R - 8) * Math.cos(venusRad)
  const vy = CY + (RING_R - 8) * Math.sin(venusRad)

  const hasMoon = moonAz != null
  const moonRad = hasMoon ? ((moonAz - 90) * Math.PI) / 180 : 0
  const mx = CX + (RING_R - 8) * Math.cos(moonRad)
  const my = CY + (RING_R - 8) * Math.sin(moonRad)

  const cardinals = [
    { label: 'N', az: 0 },
    { label: 'E', az: 90 },
    { label: 'S', az: 180 },
    { label: 'W', az: 270 },
  ]
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30)

  const absAz = Math.abs(azDiff).toFixed(1)
  let hint
  if (Math.abs(azDiff) < 3) hint = 'Facing Venus'
  else if (azDiff > 0)      hint = `Turn right  ${absAz}°`
  else                       hint = `Turn left  ${absAz}°`

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <svg width="300" height="300" viewBox="0 0 300 300" style={{ maxWidth: '100%', overflow: 'visible' }}>
        <g ref={groupRef}>
          {/* Ring */}
          <circle cx={CX} cy={CY} r={RING_R} stroke={GOLD} strokeWidth="1" fill="none" opacity="0.2" />
          <circle cx={CX} cy={CY} r={RING_R - 20} stroke={GOLD} strokeWidth="0.5" fill="none" opacity="0.08" />

          {/* Tick marks */}
          {ticks.map(deg => {
            const rad    = ((deg - 90) * Math.PI) / 180
            const isCard = deg % 90 === 0
            const inner  = RING_R - (isCard ? 18 : 10)
            return (
              <line
                key={deg}
                x1={CX + inner * Math.cos(rad)} y1={CY + inner * Math.sin(rad)}
                x2={CX + RING_R * Math.cos(rad)} y2={CY + RING_R * Math.sin(rad)}
                stroke={GOLD} strokeWidth={isCard ? 2 : 1}
                opacity={isCard ? 0.55 : 0.25} strokeLinecap="round"
              />
            )
          })}

          {/* Cardinal labels */}
          {cardinals.map(({ label, az }) => {
            const rad     = ((az - 90) * Math.PI) / 180
            const r       = RING_R - 32
            const isNorth = label === 'N'
            return (
              <text
                key={label}
                x={CX + r * Math.cos(rad)} y={CY + r * Math.sin(rad) + 5}
                textAnchor="middle"
                fill={isNorth ? GOLD : CREAM_DIM}
                fontSize={isNorth ? 15 : 11}
                fontFamily="Georgia, serif"
                fontWeight={isNorth ? 'bold' : 'normal'}
                opacity={isNorth ? 1 : 0.55}
              >
                {label}
              </text>
            )
          })}

          {/* North pointer */}
          <polygon
            points={`${CX},${CY - RING_R + 4} ${CX - 5},${CY - RING_R + 16} ${CX + 5},${CY - RING_R + 16}`}
            fill={GOLD} opacity="0.7"
          />

          {/* Moon dot on ring */}
          {hasMoon && moonAlt != null && moonAlt > -10 && (
            <>
              <circle cx={mx} cy={my} r={13} fill={MOON_DIM} opacity="0.18" />
              <circle cx={mx} cy={my} r={8}  fill={MOON_DIM} opacity="0.55" />
              <text x={mx} y={my + 4} textAnchor="middle" fill={MOON_C} fontSize="10" fontFamily="Georgia, serif">◑</text>
            </>
          )}

          {/* Venus dot on ring */}
          <circle cx={vx} cy={vy} r={16} fill={GOLD} opacity="0.12" />
          <circle cx={vx} cy={vy} r={10} fill={GOLD} opacity="0.3" />
          <text x={vx} y={vy + 5} textAnchor="middle" fill={GOLD} fontSize="13" fontFamily="Georgia, serif">♀</text>
        </g>

        {/* Centre crosshair — fixed, does not rotate */}
        <line x1={CX} y1={CY - 18} x2={CX} y2={CY + 18} stroke={GOLD} strokeWidth="1" opacity="0.35" />
        <line x1={CX - 18} y1={CY} x2={CX + 18} y2={CY} stroke={GOLD} strokeWidth="1" opacity="0.35" />
        <circle cx={CX} cy={CY} r={5} fill={GOLD} opacity="0.9" />
        <circle cx={CX} cy={CY} r={2} fill={BG} />
      </svg>

      <div style={{
        fontSize: '0.92rem', fontFamily: 'Georgia, serif',
        color: Math.abs(azDiff) < 3 ? GOLD : CREAM,
        letterSpacing: '0.04em', minHeight: 22, textAlign: 'center',
      }}>
        {hint}
      </div>

      {(compassAccuracy < 0 || compassAccuracy > 20) && (
        <div style={{
          fontSize: '0.72rem', color: 'rgba(255,180,80,0.9)',
          fontFamily: '-apple-system, sans-serif', textAlign: 'center',
          padding: '6px 12px', background: 'rgba(255,140,0,0.1)',
          borderRadius: 8, border: '0.5px solid rgba(255,140,0,0.25)',
        }}>
          {compassAccuracy < 0
            ? 'Compass uncalibrated — move phone in a figure-8'
            : `Compass accuracy ±${Math.round(compassAccuracy)}° — move phone in a figure-8`}
        </div>
      )}

      <ElevationBar venusAlt={venusAlt} deviceElevation={deviceElevation} />
    </div>
  )
}

// ─── Corner brackets ──────────────────────────────────────────────────────────

function CornerBrackets() {
  const sz = 22, t = 2
  const positions = [
    { top: 14, left: 14,   borderTop: `${t}px solid ${GOLD}`, borderLeft:  `${t}px solid ${GOLD}` },
    { top: 14, right: 14,  borderTop: `${t}px solid ${GOLD}`, borderRight: `${t}px solid ${GOLD}` },
    { bottom: 14, left: 14,  borderBottom: `${t}px solid ${GOLD}`, borderLeft:  `${t}px solid ${GOLD}` },
    { bottom: 14, right: 14, borderBottom: `${t}px solid ${GOLD}`, borderRight: `${t}px solid ${GOLD}` },
  ]
  return (
    <>
      {positions.map((pos, i) => (
        <div key={i} style={{ position: 'absolute', width: sz, height: sz, opacity: 0.5, ...pos }} />
      ))}
    </>
  )
}

// ─── Full-screen viewfinder ───────────────────────────────────────────────────

function FullscreenViewfinder({
  alphaRaw, betaRaw,
  venusAz, venusAlt, venusIllum, venusElong,
  moonAz, moonAlt, moonIllum,
  starAzAltsRef, constAzAltsRef,
  compassOffset,
  locked, videoRef, cameraError,
  azDiff, altDiff,
  onBack, onRecalibrate,
}) {
  const dotRef         = useRef(null)
  const moonDotRef     = useRef(null)
  const skyCanvasRef   = useRef(null)
  const canvasSizeRef  = useRef({ W: 0, H: 0, dpr: 1 })
  const smoothAzD      = useRef(azDiff)
  const smoothAltD     = useRef(altDiff)
  const smoothMoonAzD  = useRef(0)
  const smoothMoonAltD = useRef(0)
  const smoothDevElRef = useRef(0)

  const hasMoon = moonAz != null && moonAlt != null

  // Cache canvas dimensions — avoid reading offsetWidth inside RAF (triggers reflow)
  useEffect(() => {
    const canvas = skyCanvasRef.current
    if (!canvas) return
    const onResize = () => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width  = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvasSizeRef.current = { W, H, dpr }
    }
    onResize()
    const obs = new ResizeObserver(onResize)
    obs.observe(canvas)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    let raf
    const animate = () => {
      const eff = (alphaRaw.current + compassOffset.current + 360) % 360

      // Smooth device elevation — raw sensor is noisy, horizon jumps without this
      const rawDevEl = betaRaw.current - 90
      smoothDevElRef.current += (rawDevEl - smoothDevElRef.current) * 0.12
      const devEl = smoothDevElRef.current

      // --- Canvas: horizon + constellation lines + stars ---
      const canvas = skyCanvasRef.current
      const { W, H, dpr } = canvasSizeRef.current
      if (canvas && W > 0 && H > 0) {
        const ctx = canvas.getContext('2d')
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)

        const horizY = H * 0.5 + (devEl / V_FOV_HALF) * H * 0.5

        if (horizY >= H) {
          ctx.fillStyle = 'rgba(15,55,15,0.22)'
          ctx.fillRect(0, 0, W, H)
        } else if (horizY > 0) {
          ctx.fillStyle = 'rgba(15,55,15,0.22)'
          ctx.fillRect(0, horizY, W, H - horizY)
          const g = ctx.createLinearGradient(0, horizY - 8, 0, horizY + 8)
          g.addColorStop(0, 'rgba(70,190,90,0)'); g.addColorStop(0.5, 'rgba(70,190,90,0.48)'); g.addColorStop(1, 'rgba(70,190,90,0)')
          ctx.fillStyle = g; ctx.fillRect(0, horizY - 8, W, 16)
          ctx.beginPath(); ctx.moveTo(0, horizY); ctx.lineTo(W, horizY)
          ctx.strokeStyle = 'rgba(70,190,90,0.6)'; ctx.lineWidth = 1; ctx.stroke()
        }

        // Helper to project az/alt to canvas x/y
        const stars = starAzAltsRef.current ?? []
        const project = (az, alt) => {
          const azD  = ((az - eff + 540) % 360) - 180
          const altD = alt - devEl
          if (Math.abs(azD) > H_FOV_HALF * 1.2 || Math.abs(altD) > V_FOV_HALF * 1.2) return null
          return {
            x: W * 0.5 + (azD  / H_FOV_HALF) * W * 0.5,
            y: H * 0.5 - (altD / V_FOV_HALF) * H * 0.5,
          }
        }

        // Constellation lines
        ctx.strokeStyle = 'rgba(200,184,112,0.15)'
        ctx.lineWidth = 1
        for (const [nameA, nameB] of CONSTELLATION_LINES) {
          const iA = STAR_INDEX[nameA], iB = STAR_INDEX[nameB]
          if (iA == null || iB == null) continue
          const sA = stars[iA], sB = stars[iB]
          if (!sA || !sB) continue
          const pA = project(sA.az, sA.alt)
          const pB = project(sB.az, sB.alt)
          if (!pA || !pB) continue
          ctx.beginPath()
          ctx.moveTo(pA.x, pA.y)
          ctx.lineTo(pB.x, pB.y)
          ctx.stroke()
        }

        // Stars
        ctx.fillStyle = '#dcd7c8'
        ctx.textBaseline = 'middle'
        ctx.font = '9px -apple-system, sans-serif'
        for (const star of stars) {
          const p = project(star.az, star.alt)
          if (!p) continue
          const r  = Math.max(1.2, 4.5 - star.mag * 1.0)
          const op = Math.max(0.3, Math.min(0.92, 1.05 - star.mag * 0.22))
          if (star.mag < 1.5) {
            ctx.globalAlpha = op * 0.12
            ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.8, 0, Math.PI * 2); ctx.fill()
            ctx.globalAlpha = op * 0.25
            ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.6, 0, Math.PI * 2); ctx.fill()
          }
          ctx.globalAlpha = op
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill()
          if (star.name && star.mag < 1.5) {
            ctx.globalAlpha = 0.52
            ctx.fillText(star.name, p.x + r + 4, p.y)
          }
        }

        // Constellation names
        ctx.font = '10px Georgia, serif'
        ctx.fillStyle = '#c8b870'
        for (const c of (constAzAltsRef.current ?? [])) {
          if (c.alt < -10) continue
          const p = project(c.az, c.alt)
          if (!p) continue
          ctx.globalAlpha = 0.28
          ctx.fillText(c.name, p.x, p.y)
        }

        ctx.globalAlpha = 1
      }

      // Venus
      const tAzD  = ((venusAz - eff + 540) % 360) - 180
      const tAltD = venusAlt - devEl
      smoothAzD.current  += (((tAzD  - smoothAzD.current  + 540) % 360) - 180) * 0.14
      smoothAltD.current += (tAltD - smoothAltD.current) * 0.14
      if (dotRef.current) {
        const xPct = Math.max(2, Math.min(98, 50 + (smoothAzD.current  / H_FOV_HALF) * 50))
        const yPct = Math.max(5, Math.min(95, 50 - (smoothAltD.current / V_FOV_HALF) * 50))
        dotRef.current.style.left = xPct + '%'
        dotRef.current.style.top  = yPct + '%'
      }

      // Moon
      if (hasMoon && moonDotRef.current) {
        const mAzD  = ((moonAz - eff + 540) % 360) - 180
        const mAltD = moonAlt - devEl
        smoothMoonAzD.current  += (((mAzD  - smoothMoonAzD.current  + 540) % 360) - 180) * 0.14
        smoothMoonAltD.current += (mAltD - smoothMoonAltD.current) * 0.14
        const inView = Math.abs(smoothMoonAzD.current) < H_FOV_HALF + 3
                    && Math.abs(smoothMoonAltD.current) < V_FOV_HALF + 3
        moonDotRef.current.style.display = inView ? 'flex' : 'none'
        if (inView) {
          moonDotRef.current.style.left = (50 + (smoothMoonAzD.current  / H_FOV_HALF) * 50) + '%'
          moonDotRef.current.style.top  = (50 - (smoothMoonAltD.current / V_FOV_HALF) * 50) + '%'
        }
      }

      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [alphaRaw, betaRaw, venusAz, venusAlt, moonAz, moonAlt, hasMoon, starAzAltsRef, constAzAltsRef, compassOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  const azAbs  = Math.abs(azDiff).toFixed(1)
  const altAbs = Math.abs(altDiff).toFixed(1)
  const azHint  = Math.abs(azDiff)  < 3 ? null : azDiff  > 0 ? `Turn right ${azAbs}°` : `Turn left ${azAbs}°`
  const altHint = Math.abs(altDiff) < 3 ? null : altDiff > 0 ? `Tilt up ${altAbs}°`   : `Tilt down ${altAbs}°`

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#080806' }}>
      {/* Camera feed */}
      {!cameraError && (
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      {cameraError && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: '0.72rem', color: CREAM_DIM, fontFamily: 'Georgia, serif', textAlign: 'center', padding: '0 24px' }}>
            Camera unavailable — check Settings → Privacy → Camera
          </span>
        </div>
      )}

      {/* Canvas: horizon + star field */}
      <canvas
        ref={skyCanvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      />

      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
        <CornerBrackets />

        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(200,184,112,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200,184,112,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '25% 25%',
        }} />

        {/* Crosshair */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 44, height: 44 }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: GOLD, opacity: 0.3, transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: GOLD, opacity: 0.3, transform: 'translateX(-50%)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 6, height: 6, borderRadius: '50%', background: GOLD, opacity: 0.45, transform: 'translate(-50%, -50%)' }} />
          </div>
        </div>

        {/* Venus dot */}
        <div ref={dotRef} style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          {locked && (
            <>
              <div className="sf-ripple" style={{ animationDelay: '0s' }} />
              <div className="sf-ripple" style={{ animationDelay: '0.4s' }} />
              <div className="sf-ripple" style={{ animationDelay: '0.8s' }} />
            </>
          )}
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: locked ? GOLD : GOLD_DIM,
            border: `2px solid ${GOLD}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, color: locked ? '#1a1a14' : GOLD,
            fontFamily: 'Georgia, serif',
            boxShadow: locked ? `0 0 22px ${GOLD}` : 'none',
            transition: 'background 0.25s, box-shadow 0.25s, color 0.25s',
          }}>♀</div>
          <div style={{ textAlign: 'center', marginTop: 3, fontSize: '0.6rem', color: GOLD, fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}>Venus</div>
        </div>

        {/* Moon dot */}
        {hasMoon && (
          <div
            ref={moonDotRef}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: MOON_DIM,
              border: `1.5px solid rgba(220,215,200,0.55)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: MOON_C,
            }}>◑</div>
            <div style={{ textAlign: 'center', marginTop: 3, fontSize: '0.55rem', color: MOON_C, fontFamily: '-apple-system, sans-serif', whiteSpace: 'nowrap', opacity: 0.82 }}>
              Moon{moonIllum != null ? ` ${Math.round(moonIllum)}%` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        paddingTop: 'max(14px, env(safe-area-inset-top))',
        paddingLeft: 16, paddingRight: 16, paddingBottom: 14,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        background: 'linear-gradient(to bottom, rgba(8,8,6,0.72), transparent)',
        pointerEvents: 'none',
      }}>
        <button
          onClick={onBack}
          style={{
            pointerEvents: 'auto',
            background: 'transparent', border: 'none',
            color: CREAM, fontSize: '0.82rem', fontFamily: 'Georgia, serif',
            letterSpacing: '0.03em', cursor: 'pointer', padding: '6px 0',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          ← Compass
        </button>
      </div>

      {/* Lock badge */}
      {locked && (
        <div style={{
          position: 'absolute',
          top: 'max(60px, calc(env(safe-area-inset-top) + 46px))',
          left: '50%', transform: 'translateX(-50%)',
          background: GOLD, color: '#1a1a14',
          padding: '5px 16px', borderRadius: 20,
          fontSize: '0.7rem', fontFamily: 'Georgia, serif',
          fontWeight: 700, letterSpacing: '0.12em', whiteSpace: 'nowrap',
          zIndex: 20,
        }}>
          LOCKED ON VENUS
        </div>
      )}

      {/* Direction hints */}
      {!locked && (azHint || altHint) && (
        <div style={{
          position: 'absolute', bottom: 140, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          pointerEvents: 'none', zIndex: 10,
        }}>
          {altHint && <span style={{ fontSize: '0.82rem', color: CREAM, fontFamily: 'Georgia, serif', opacity: 0.8 }}>{altDiff > 0 ? '↑ ' : '↓ '}{altHint}</span>}
          {azHint  && <span style={{ fontSize: '0.82rem', color: CREAM, fontFamily: 'Georgia, serif', opacity: 0.8 }}>{azDiff > 0 ? '' : ''}{azHint}{azDiff > 0 ? ' →' : ' ←'}</span>}
        </div>
      )}

      {/* Bottom strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        paddingBottom: 'max(18px, env(safe-area-inset-bottom))',
        background: 'linear-gradient(to top, rgba(8,8,6,0.82), transparent)',
        pointerEvents: 'auto',
      }}>
        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8, padding: '12px 20px 10px',
          borderTop: '0.5px solid rgba(200,184,112,0.12)',
        }}>
          {[
            { label: 'Azimuth',    value: `${venusAz.toFixed(1)}°` },
            { label: 'Altitude',   value: `${venusAlt.toFixed(1)}°` },
            { label: 'Illuminated', value: `${venusIllum.toFixed(0)}%` },
            { label: 'Elongation', value: `${venusElong.toFixed(1)}°` },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: CREAM_DIM, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '0.85rem', color: GOLD, fontFamily: 'Georgia, serif' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Recalibrate button */}
        <div style={{ padding: '0 20px 4px', display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onRecalibrate}
            style={{
              background: 'transparent',
              border: `1px solid ${GOLD}`,
              borderRadius: 20, color: GOLD,
              padding: '8px 20px', fontSize: '0.78rem',
              fontFamily: 'Georgia, serif', letterSpacing: '0.05em',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            Recalibrate
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatsRow({ azimuth, altitude, illumination, elongation }) {
  const items = [
    { label: 'Azimuth',    value: `${azimuth.toFixed(1)}°` },
    { label: 'Altitude',   value: `${altitude.toFixed(1)}°` },
    { label: 'Illuminated', value: `${illumination.toFixed(0)}%` },
    { label: 'Elongation', value: `${elongation.toFixed(1)}°` },
  ]
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8, padding: '14px 20px 0',
      borderTop: '0.5px solid rgba(200,184,112,0.12)',
    }}>
      {items.map(({ label, value }) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: CREAM_DIM, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: '0.85rem', color: GOLD, fontFamily: 'Georgia, serif' }}>{value}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Main SkyFinder ───────────────────────────────────────────────────────────

export default function SkyFinder({ data, loading, error, moonData, sunData, lat, lon }) {
  const [permission, setPermission]           = useState(null)
  const [mode, setMode]                       = useState('compass')
  const [calibrated, setCalibrated]           = useState(false)
  const [alpha, setAlpha]                     = useState(0)
  const [beta, setBeta]                       = useState(90)
  const [compassAccuracy, setCompassAccuracy] = useState(-1)
  const [cameraError, setCameraError]         = useState(false)
  const [compassOffsetState, setCompassOffsetState] = useState(0)
  const [altOffsetState, setAltOffsetState]   = useState(0)

  const alphaRaw       = useRef(0)
  const betaRaw        = useRef(90)
  const lastTextUpdate = useRef(0)
  const videoRef       = useRef(null)
  const streamRef      = useRef(null)
  const compassOffset  = useRef(0)
  const altitudeOffset = useRef(0)
  const starAzAltsRef  = useRef([])
  const constAzAltsRef = useRef([])
  const liveVenusRef   = useRef({ az: 0, alt: 0 })
  const liveMoonRef    = useRef({ az: null, alt: null })
  const prevLockedRef  = useRef(false)

  // Restore persisted calibration on mount (if < 1 hour old)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sky_calibration'))
      if (saved && Date.now() - saved.timestamp < 3600000) {
        compassOffset.current  = saved.compassOffset
        altitudeOffset.current = saved.altitudeOffset
        setCompassOffsetState(saved.compassOffset)
        setAltOffsetState(saved.altitudeOffset)
        setCalibrated(true)
      }
    } catch { /* no saved calibration */ }
  }, [])

  // Permission check — auto-request if previously granted
  useEffect(() => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      setPermission('unavailable')
    } else if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const prev = localStorage.getItem('compass_permission')
      if (prev === 'granted') {
        DeviceOrientationEvent.requestPermission()
          .then(r => setPermission(r === 'granted' ? 'granted' : 'prompt'))
          .catch(() => setPermission('prompt'))
      } else {
        setPermission('prompt')
      }
    } else {
      setPermission('granted')
    }
  }, [])

  // Orientation listener
  useEffect(() => {
    if (permission !== 'granted') return
    const handler = (e) => {
      const heading = e.webkitCompassHeading ?? e.alpha
      if (heading  != null) alphaRaw.current = heading
      if (e.beta   != null) betaRaw.current  = e.beta
      if (e.webkitCompassAccuracy != null) setCompassAccuracy(e.webkitCompassAccuracy)
      const now = Date.now()
      if (now - lastTextUpdate.current > 160) {
        lastTextUpdate.current = now
        if (heading != null) setAlpha(heading)
        if (e.beta  != null) setBeta(e.beta)
      }
    }
    window.addEventListener('deviceorientation', handler, true)
    return () => window.removeEventListener('deviceorientation', handler, true)
  }, [permission])

  // Camera — active in viewfinder OR calibration mode
  useEffect(() => {
    const needsCamera = permission === 'granted' && (mode === 'viewfinder' || !calibrated)
    if (!needsCamera) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) { setCameraError(true); return }
    let cancelled = false
    setCameraError(false)
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => { if (!cancelled) setCameraError(true) })
    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [mode, permission, calibrated])

  // Star, constellation, Venus & Moon az/alt — recompute every 5s
  useEffect(() => {
    const update = () => {
      const l = lat ?? 0, o = lon ?? 0
      starAzAltsRef.current  = STARS.map(s => ({ ...s, ...raDecToAzAlt(s.ra, s.dec, l, o) }))
      constAzAltsRef.current = CONSTELLATIONS.map(c => ({ ...c, ...raDecToAzAlt(c.ra, c.dec, l, o) }))
      if (data?.ra != null && data?.dec != null) {
        liveVenusRef.current = raDecToAzAlt(data.ra, data.dec, l, o)
      }
      if (moonData?.ra != null && moonData?.dec != null) {
        liveMoonRef.current = raDecToAzAlt(moonData.ra, moonData.dec, l, o)
      } else {
        liveMoonRef.current = { az: moonData?.azimuth ?? null, alt: moonData?.altitude ?? null }
      }
    }
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [lat, lon, data, moonData])

  async function requestPermission() {
    try {
      const result = await DeviceOrientationEvent.requestPermission()
      if (result === 'granted') {
        localStorage.setItem('compass_permission', 'granted')
        setPermission('granted')
      } else {
        localStorage.removeItem('compass_permission')
        setPermission('denied')
      }
    } catch {
      localStorage.removeItem('compass_permission')
      setPermission('unavailable')
    }
  }

  // Calibration handler — computes az + alt offsets from a known object
  function handleCalibrate(target) {
    if (target === 'skip') {
      compassOffset.current = 0
      altitudeOffset.current = 0
      setCompassOffsetState(0)
      setAltOffsetState(0)
      setCalibrated(true)
      localStorage.setItem('sky_calibration', JSON.stringify({
        compassOffset: 0, altitudeOffset: 0, timestamp: Date.now(),
      }))
      return
    }

    const refData = target === 'moon' ? moonData : sunData
    if (!refData) { setCalibrated(true); return }

    const trueAz  = refData.azimuth
    const trueAlt = refData.altitude
    const deviceHeading   = alphaRaw.current
    const deviceElevation = betaRaw.current - 90

    let azOff = trueAz - deviceHeading
    if (azOff > 180) azOff -= 360
    if (azOff < -180) azOff += 360
    const altOff = trueAlt - deviceElevation

    compassOffset.current  = azOff
    altitudeOffset.current = altOff
    setCompassOffsetState(azOff)
    setAltOffsetState(altOff)
    setCalibrated(true)

    localStorage.setItem('sky_calibration', JSON.stringify({
      compassOffset: azOff, altitudeOffset: altOff, timestamp: Date.now(),
    }))
  }

  // Venus data — use live-computed az/alt from RA/Dec
  const venusAz    = liveVenusRef.current.az  ?? data?.azimuth  ?? 0
  const venusAlt   = liveVenusRef.current.alt ?? data?.altitude ?? 0
  const venusIllum = data?.illumination ?? 0
  const venusElong = data?.elongation   ?? 0
  const zodiac     = data?.zodiac       ?? '–'
  const phase      = data?.phase        ?? '–'
  const isEvening  = data?.is_evening_star ?? false
  const riseTime   = data?.rise_time    ?? null
  const setTime    = data?.set_time     ?? null

  // Moon data — use live-computed az/alt from RA/Dec
  const moonAz    = liveMoonRef.current.az  ?? moonData?.azimuth  ?? null
  const moonAlt   = liveMoonRef.current.alt ?? moonData?.altitude ?? null
  const moonIllum = moonData?.illumination ?? null

  // Orientation math
  const effectiveAlpha  = (alpha + compassOffsetState + 360) % 360
  const deviceElevation = beta - 90 + altOffsetState
  const azDiff          = ((venusAz - effectiveAlpha + 540) % 360) - 180
  const altDiff         = venusAlt - deviceElevation

  const locked = permission === 'granted' && mode === 'viewfinder'
    && Math.abs(azDiff) < 4 && Math.abs(altDiff) < 4

  // Haptic on lock transition
  useEffect(() => {
    if (locked && !prevLockedRef.current) triggerHaptic()
    prevLockedRef.current = locked
  }, [locked])

  // Permission screens
  if (permission === null) {
    return (
      <div style={{ background: BG, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: CREAM_DIM, fontFamily: 'Georgia, serif' }}>Initialising…</p>
      </div>
    )
  }
  if (permission !== 'granted') {
    return (
      <PermissionScreen
        state={permission}
        onRequest={permission === 'prompt' ? requestPermission : null}
      />
    )
  }

  // Calibration screen — shown before compass/viewfinder
  if (!calibrated) {
    return (
      <CalibrationScreen
        videoRef={videoRef}
        cameraError={cameraError}
        moonData={moonData}
        sunData={sunData}
        onCalibrate={handleCalibrate}
      />
    )
  }

  // Rise/set display string
  const riseSetStr = riseTime && setTime
    ? `Rises ${riseTime} · Sets ${setTime}`
    : riseTime ? `Rises ${riseTime}`
    : setTime  ? `Sets ${setTime}`
    : null

  return (
    <>
      {/* Main page — compass mode */}
      <div style={{
        background: BG,
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
        color: CREAM,
      }}>
        {/* Header */}
        <div style={{ padding: '4px 20px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.14em', color: GOLD, textTransform: 'uppercase', marginBottom: 5 }}>
            {isEvening ? 'Evening Star' : 'Morning Star'} · {zodiac}
          </div>
          <div style={{ fontSize: '0.8rem', color: CREAM_DIM }}>
            {loading ? 'Loading Venus…'
              : error ? 'Venus data unavailable'
              : venusAlt < 0
              ? `Below horizon · ${venusAlt.toFixed(1)}°`
              : `Altitude ${venusAlt.toFixed(1)}° · ${phase}`}
          </div>
          {riseSetStr && (
            <div style={{ fontSize: '0.7rem', color: CREAM_DIM, marginTop: 3, opacity: 0.7 }}>
              {riseSetStr}
            </div>
          )}
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', margin: '0 20px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3 }}>
          {['compass', 'viewfinder'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
                background: mode === m ? '#3D3D2E' : 'transparent',
                color: mode === m ? GOLD : CREAM_DIM,
                fontSize: '0.78rem', letterSpacing: '0.05em', cursor: 'pointer',
                fontFamily: 'Georgia, serif', fontWeight: mode === m ? 600 : 400,
                transition: 'background 0.2s, color 0.2s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {m === 'compass' ? 'Compass' : 'Viewfinder'}
            </button>
          ))}
        </div>

        {/* Compass */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', minHeight: 0 }}>
          <CompassView
            alphaRaw={alphaRaw}
            alpha={alpha}
            venusAz={venusAz}
            venusAlt={venusAlt}
            deviceElevation={deviceElevation}
            azDiff={azDiff}
            compassAccuracy={compassAccuracy}
            compassOffset={compassOffset}
            moonAz={moonAz}
            moonAlt={moonAlt}
          />
        </div>

        {/* Recalibrate button */}
        <div style={{ padding: '12px 20px 0', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setCalibrated(false)}
            style={{
              background: 'transparent',
              border: `1px solid rgba(200,184,112,0.3)`,
              borderRadius: 20, color: CREAM_DIM,
              padding: '7px 18px', fontSize: '0.72rem',
              fontFamily: 'Georgia, serif', letterSpacing: '0.04em',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            Recalibrate
          </button>
        </div>

        <StatsRow
          azimuth={venusAz}
          altitude={venusAlt}
          illumination={venusIllum}
          elongation={venusElong}
        />
      </div>

      {/* Full-screen viewfinder overlay */}
      {mode === 'viewfinder' && (
        <FullscreenViewfinder
          alphaRaw={alphaRaw}
          betaRaw={betaRaw}
          venusAz={venusAz}
          venusAlt={venusAlt}
          venusIllum={venusIllum}
          venusElong={venusElong}
          moonAz={moonAz}
          moonAlt={moonAlt}
          moonIllum={moonIllum}
          starAzAltsRef={starAzAltsRef}
          constAzAltsRef={constAzAltsRef}
          compassOffset={compassOffset}
          locked={locked}
          videoRef={videoRef}
          cameraError={cameraError}
          azDiff={azDiff}
          altDiff={altDiff}
          onBack={() => setMode('compass')}
          onRecalibrate={() => setCalibrated(false)}
        />
      )}
    </>
  )
}
