import { useState, useEffect, useRef } from 'react'

const GOLD    = '#c8b870'
const GOLD_DIM = 'rgba(200,184,112,0.3)'
const BG      = '#1a1a14'
const CREAM   = 'rgba(245,240,232,0.88)'
const CREAM_DIM = 'rgba(245,240,232,0.45)'

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
      {/* Compass icon */}
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
        {/* Track fill to device position */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${dPct}%`,
          height: '100%',
          background: 'rgba(200,184,112,0.15)',
          borderRadius: 3,
        }} />

        {/* Venus marker */}
        <div style={{
          position: 'absolute',
          left: `${vPct}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: GOLD,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: '#1a1a14',
          fontWeight: 600,
          zIndex: 2,
        }}>
          ♀
        </div>

        {/* Device elevation tick */}
        <div style={{
          position: 'absolute',
          left: `${dPct}%`,
          top: -4,
          transform: 'translateX(-50%)',
          width: 2,
          height: 14,
          background: CREAM,
          borderRadius: 1,
          opacity: 0.6,
          zIndex: 1,
        }} />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 8,
        fontSize: '0.62rem',
        color: CREAM_DIM,
      }}>
        <span>{MIN}°</span>
        <span style={{ color: GOLD }}>♀ {venusAlt.toFixed(1)}°</span>
        <span>{MAX}°</span>
      </div>
    </div>
  )
}

// ─── Compass view ─────────────────────────────────────────────────────────────

function CompassView({ alphaRaw, alpha, venusAz, venusAlt, deviceElevation, azDiff, compassAccuracy }) {
  const CX = 150, CY = 150
  const RING_R = 126

  // Ref for the rotating SVG group — RAF drives it directly, no React re-render
  const groupRef = useRef(null)
  const smoothAngle = useRef(alpha)

  useEffect(() => {
    let raf
    const animate = () => {
      const target = alphaRaw.current
      const curr   = smoothAngle.current
      // Shortest-path interpolation across the 0/360 seam
      const diff   = ((target - curr + 540) % 360) - 180
      smoothAngle.current = curr + diff * 0.14
      if (groupRef.current) {
        groupRef.current.setAttribute('transform', `rotate(${-smoothAngle.current}, ${CX}, ${CY})`)
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [alphaRaw]) // eslint-disable-line react-hooks/exhaustive-deps

  // Venus dot coordinates on the ring (azimuth in SVG: 0=right, so -90 offset)
  const venusRad = ((venusAz - 90) * Math.PI) / 180
  const vx = CX + (RING_R - 8) * Math.cos(venusRad)
  const vy = CY + (RING_R - 8) * Math.sin(venusRad)

  const cardinals = [
    { label: 'N', az: 0 },
    { label: 'E', az: 90 },
    { label: 'S', az: 180 },
    { label: 'W', az: 270 },
  ]

  const ticks = Array.from({ length: 12 }, (_, i) => i * 30)

  // Hint text (alpha state updates at ~6fps — fine for text)
  const absAz = Math.abs(azDiff).toFixed(1)
  let hint
  if (Math.abs(azDiff) < 3) hint = 'Facing Venus'
  else if (azDiff > 0)      hint = `Turn right  ${absAz}°`
  else                       hint = `Turn left  ${absAz}°`

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
    }}>
      <svg
        width="300"
        height="300"
        viewBox="0 0 300 300"
        style={{ maxWidth: '100%', overflow: 'visible' }}
      >
        {/* Whole compass rotates opposite to device heading — driven by RAF, not React */}
        <g ref={groupRef}>
          {/* Ring */}
          <circle cx={CX} cy={CY} r={RING_R} stroke={GOLD} strokeWidth="1" fill="none" opacity="0.2" />
          <circle cx={CX} cy={CY} r={RING_R - 20} stroke={GOLD} strokeWidth="0.5" fill="none" opacity="0.08" />

          {/* Tick marks */}
          {ticks.map(deg => {
            const rad = ((deg - 90) * Math.PI) / 180
            const isCard = deg % 90 === 0
            const inner = RING_R - (isCard ? 18 : 10)
            return (
              <line
                key={deg}
                x1={CX + inner * Math.cos(rad)}
                y1={CY + inner * Math.sin(rad)}
                x2={CX + RING_R * Math.cos(rad)}
                y2={CY + RING_R * Math.sin(rad)}
                stroke={GOLD}
                strokeWidth={isCard ? 2 : 1}
                opacity={isCard ? 0.55 : 0.25}
                strokeLinecap="round"
              />
            )
          })}

          {/* Cardinal labels */}
          {cardinals.map(({ label, az }) => {
            const rad = ((az - 90) * Math.PI) / 180
            const r = RING_R - 32
            const isNorth = label === 'N'
            return (
              <text
                key={label}
                x={CX + r * Math.cos(rad)}
                y={CY + r * Math.sin(rad) + 5}
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

          {/* North pointer triangle */}
          <polygon
            points={`${CX},${CY - RING_R + 4} ${CX - 5},${CY - RING_R + 16} ${CX + 5},${CY - RING_R + 16}`}
            fill={GOLD}
            opacity="0.7"
          />

          {/* Venus dot on ring */}
          <circle cx={vx} cy={vy} r={16} fill={GOLD} opacity="0.12" />
          <circle cx={vx} cy={vy} r={10} fill={GOLD} opacity="0.3" />
          <text
            x={vx}
            y={vy + 5}
            textAnchor="middle"
            fill={GOLD}
            fontSize="13"
            fontFamily="Georgia, serif"
          >
            ♀
          </text>
        </g>

        {/* Center crosshair — fixed, does not rotate */}
        <line x1={CX} y1={CY - 18} x2={CX} y2={CY + 18} stroke={GOLD} strokeWidth="1" opacity="0.35" />
        <line x1={CX - 18} y1={CY} x2={CX + 18} y2={CY} stroke={GOLD} strokeWidth="1" opacity="0.35" />
        <circle cx={CX} cy={CY} r={5} fill={GOLD} opacity="0.9" />
        <circle cx={CX} cy={CY} r={2} fill={BG} />
      </svg>

      {/* Hint */}
      <div style={{
        fontSize: '0.92rem',
        fontFamily: 'Georgia, serif',
        color: Math.abs(azDiff) < 3 ? GOLD : CREAM,
        letterSpacing: '0.04em',
        minHeight: 22,
        textAlign: 'center',
      }}>
        {hint}
      </div>

      {/* Calibration warning */}
      {(compassAccuracy < 0 || compassAccuracy > 20) && (
        <div style={{
          fontSize: '0.72rem',
          color: 'rgba(255,180,80,0.9)',
          fontFamily: '-apple-system, sans-serif',
          textAlign: 'center',
          padding: '6px 12px',
          background: 'rgba(255,140,0,0.1)',
          borderRadius: 8,
          border: '0.5px solid rgba(255,140,0,0.25)',
        }}>
          {compassAccuracy < 0
            ? 'Compass uncalibrated — move phone in a figure-8'
            : `Compass accuracy ±${Math.round(compassAccuracy)}° — move phone in a figure-8`}
        </div>
      )}

      {/* Elevation bar */}
      <ElevationBar venusAlt={venusAlt} deviceElevation={deviceElevation} />
    </div>
  )
}

// ─── Corner brackets for viewfinder ──────────────────────────────────────────

function CornerBrackets() {
  const sz = 22, t = 2
  const color = GOLD
  const opacity = 0.5
  const positions = [
    { top: 14, left: 14,  borderTop: `${t}px solid ${color}`, borderLeft:  `${t}px solid ${color}` },
    { top: 14, right: 14, borderTop: `${t}px solid ${color}`, borderRight: `${t}px solid ${color}` },
    { bottom: 14, left: 14,  borderBottom: `${t}px solid ${color}`, borderLeft:  `${t}px solid ${color}` },
    { bottom: 14, right: 14, borderBottom: `${t}px solid ${color}`, borderRight: `${t}px solid ${color}` },
  ]
  return (
    <>
      {positions.map((pos, i) => (
        <div key={i} style={{ position: 'absolute', width: sz, height: sz, opacity, ...pos }} />
      ))}
    </>
  )
}

// ─── Viewfinder view ──────────────────────────────────────────────────────────

function ViewfinderView({ alphaRaw, betaRaw, venusAz, venusAlt, azDiff, altDiff, locked, videoRef, cameraError }) {
  // Dot ref — RAF drives position directly
  const dotRef      = useRef(null)
  const smoothAzD   = useRef(azDiff)
  const smoothAltD  = useRef(altDiff)

  useEffect(() => {
    let raf
    const animate = () => {
      const targetAzD  = ((venusAz - alphaRaw.current + 540) % 360) - 180
      const targetAltD = venusAlt - (betaRaw.current - 90)
      // Lerp with wrap-aware az diff
      const azDelta = ((targetAzD - smoothAzD.current + 540) % 360) - 180
      smoothAzD.current  += azDelta * 0.14
      smoothAltD.current += (targetAltD - smoothAltD.current) * 0.14
      if (dotRef.current) {
        const azC  = Math.max(-90, Math.min(90,  smoothAzD.current))
        const altC = Math.max(-60, Math.min(60, smoothAltD.current))
        dotRef.current.style.left = `${50 + (azC  / 90)  * 42}%`
        dotRef.current.style.top  = `${50 - (altC / 60) * 38}%`
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [alphaRaw, betaRaw, venusAz, venusAlt]) // eslint-disable-line react-hooks/exhaustive-deps

  // Hint text uses slower-updating azDiff/altDiff props (fine for text)
  const azAbs  = Math.abs(azDiff).toFixed(1)
  const altAbs = Math.abs(altDiff).toFixed(1)

  const azHint  = Math.abs(azDiff)  < 3 ? null : azDiff  > 0 ? `Turn right ${azAbs}°` : `Turn left ${azAbs}°`
  const altHint = Math.abs(altDiff) < 3 ? null : altDiff > 0 ? `Tilt up ${altAbs}°`   : `Tilt down ${altAbs}°`

  return (
    <div style={{
      width: '100%',
      aspectRatio: '9 / 15',
      position: 'relative',
      borderRadius: 12,
      overflow: 'hidden',
      background: '#080806',
      border: `1px solid rgba(200,184,112,0.12)`,
    }}>
      {/* Live camera feed */}
      {!cameraError && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
      {cameraError && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
        }}>
          <span style={{ fontSize: '1.4rem' }}>📷</span>
          <span style={{ fontSize: '0.72rem', color: CREAM_DIM, fontFamily: 'Georgia, serif', textAlign: 'center', padding: '0 24px' }}>
            Camera unavailable — check Settings → Privacy → Camera
          </span>
        </div>
      )}

      <CornerBrackets />

      {/* Grid lines */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(200,184,112,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,184,112,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '25% 25%',
      }} />

      {/* Centre crosshair */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ position: 'relative', width: 44, height: 44 }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: GOLD, opacity: 0.3, transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: GOLD, opacity: 0.3, transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 6, height: 6, borderRadius: '50%', background: GOLD, opacity: 0.45, transform: 'translate(-50%, -50%)' }} />
        </div>
      </div>

      {/* Venus dot — position driven by RAF, not React state */}
      <div ref={dotRef} style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 5,
      }}>
        {locked && (
          <>
            <div className="sf-ripple" style={{ animationDelay: '0s' }} />
            <div className="sf-ripple" style={{ animationDelay: '0.4s' }} />
            <div className="sf-ripple" style={{ animationDelay: '0.8s' }} />
          </>
        )}
        <div style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: locked ? GOLD : GOLD_DIM,
          border: `2px solid ${GOLD}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          color: locked ? '#1a1a14' : GOLD,
          fontFamily: 'Georgia, serif',
          boxShadow: locked ? `0 0 22px ${GOLD}` : 'none',
          transition: 'background 0.25s, box-shadow 0.25s, color 0.25s',
        }}>
          ♀
        </div>
      </div>

      {/* Lock badge */}
      {locked && (
        <div style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          background: GOLD,
          color: '#1a1a14',
          padding: '5px 16px',
          borderRadius: 20,
          fontSize: '0.7rem',
          fontFamily: 'Georgia, serif',
          fontWeight: 700,
          letterSpacing: '0.12em',
          whiteSpace: 'nowrap',
          zIndex: 10,
        }}>
          LOCKED ON VENUS
        </div>
      )}

      {/* Direction hints */}
      {!locked && (azHint || altHint) && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          pointerEvents: 'none',
        }}>
          {altHint && (
            <span style={{ fontSize: '0.82rem', color: CREAM, fontFamily: 'Georgia, serif', opacity: 0.8 }}>
              {altDiff > 0 ? '↑ ' : '↓ '}{altHint}
            </span>
          )}
          {azHint && (
            <span style={{ fontSize: '0.82rem', color: CREAM, fontFamily: 'Georgia, serif', opacity: 0.8 }}>
              {azDiff > 0 ? '' : ''}{azHint}{azDiff > 0 ? ' →' : ' ←'}
            </span>
          )}
        </div>
      )}
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
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8,
      padding: '14px 20px 0',
      borderTop: '0.5px solid rgba(200,184,112,0.12)',
    }}>
      {items.map(({ label, value }) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '0.6rem',
            color: CREAM_DIM,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 5,
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '0.88rem',
            color: GOLD,
            fontFamily: 'Georgia, serif',
          }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main SkyFinder ───────────────────────────────────────────────────────────

export default function SkyFinder({ data, loading, error }) {
  // null = checking, 'prompt' | 'granted' | 'denied' | 'unavailable'
  const [permission, setPermission]           = useState(null)
  const [mode, setMode]                       = useState('compass')
  // alpha/beta state is only for hint text + stats (updates ~6fps via lastTextUpdate gate)
  const [alpha, setAlpha]                     = useState(0)
  const [beta, setBeta]                       = useState(90)
  const [compassAccuracy, setCompassAccuracy] = useState(-1)
  const [cameraError, setCameraError]         = useState(false)
  // Raw sensor refs — updated at full sensor rate, bypassing React renders
  const alphaRaw                              = useRef(0)
  const betaRaw                               = useRef(90)
  const lastTextUpdate                        = useRef(0)
  const videoRef                              = useRef(null)
  const streamRef                             = useRef(null)

  // Detect permission requirement on mount
  useEffect(() => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      setPermission('unavailable')
    } else if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      setPermission('prompt') // iOS 13+ — needs user gesture
    } else {
      setPermission('granted') // Android / older iOS
    }
  }, [])

  // Attach listener when permission is granted
  useEffect(() => {
    if (permission !== 'granted') return

    const handler = (e) => {
      // webkitCompassHeading is true-north referenced on iOS;
      // e.alpha is only an arbitrary-reference fallback for Android.
      const heading = e.webkitCompassHeading ?? e.alpha
      // Always write to refs — no React render cost, feeds RAF loops at full rate
      if (heading  != null) alphaRaw.current = heading
      if (e.beta   != null) betaRaw.current  = e.beta
      if (e.webkitCompassAccuracy != null) setCompassAccuracy(e.webkitCompassAccuracy)
      // Update React state only ~6fps for hint text and stats
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

  // Camera — only active in viewfinder mode
  useEffect(() => {
    if (mode !== 'viewfinder' || permission !== 'granted') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(true)
      return
    }
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
  }, [mode, permission])

  async function requestPermission() {
    try {
      const result = await DeviceOrientationEvent.requestPermission()
      setPermission(result === 'granted' ? 'granted' : 'denied')
    } catch {
      setPermission('unavailable')
    }
  }

  // Venus data (with safe defaults for loading state)
  const venusAz     = data?.azimuth      ?? 0
  const venusAlt    = data?.altitude     ?? 0
  const illumination = data?.illumination ?? 0
  const elongation  = data?.elongation   ?? 0
  const zodiac      = data?.zodiac       ?? '–'
  const phase       = data?.phase        ?? '–'
  const isEvening   = data?.is_evening_star ?? false

  // Orientation math
  const azDiff         = ((venusAz - alpha + 540) % 360) - 180  // –180 to +180
  const deviceElevation = beta - 90
  const altDiff         = venusAlt - deviceElevation

  const locked = permission === 'granted' && mode === 'viewfinder'
    && Math.abs(azDiff) < 4 && Math.abs(altDiff) < 4

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

  return (
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
        <div style={{
          fontSize: '0.7rem',
          letterSpacing: '0.14em',
          color: GOLD,
          textTransform: 'uppercase',
          marginBottom: 5,
        }}>
          {isEvening ? 'Evening Star' : 'Morning Star'} · {zodiac}
        </div>
        <div style={{ fontSize: '0.8rem', color: CREAM_DIM }}>
          {loading ? 'Loading Venus…'
            : error ? 'Venus data unavailable'
            : venusAlt < 0
            ? `Below horizon · ${venusAlt.toFixed(1)}°`
            : `Altitude ${venusAlt.toFixed(1)}° · ${phase}`}
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{
        display: 'flex',
        margin: '0 20px 16px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        padding: 3,
      }}>
        {['compass', 'viewfinder'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: 8,
              background: mode === m ? '#3D3D2E' : 'transparent',
              color: mode === m ? GOLD : CREAM_DIM,
              fontSize: '0.78rem',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
              fontWeight: mode === m ? 600 : 400,
              transition: 'background 0.2s, color 0.2s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {m === 'compass' ? 'Compass' : 'Viewfinder'}
          </button>
        ))}
      </div>

      {/* Main visualization */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 20px',
        minHeight: 0,
      }}>
        {mode === 'compass' ? (
          <CompassView
            alphaRaw={alphaRaw}
            alpha={alpha}
            venusAz={venusAz}
            venusAlt={venusAlt}
            deviceElevation={deviceElevation}
            azDiff={azDiff}
            compassAccuracy={compassAccuracy}
          />
        ) : (
          <ViewfinderView
            alphaRaw={alphaRaw}
            betaRaw={betaRaw}
            venusAz={venusAz}
            venusAlt={venusAlt}
            azDiff={azDiff}
            altDiff={altDiff}
            locked={locked}
            videoRef={videoRef}
            cameraError={cameraError}
          />
        )}
      </div>

      {/* Stats row */}
      <StatsRow
        azimuth={venusAz}
        altitude={venusAlt}
        illumination={illumination}
        elongation={elongation}
      />
    </div>
  )
}
