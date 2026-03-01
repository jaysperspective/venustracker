function fmt(val, digits = 1) {
  if (val === null || val === undefined) return '—'
  return Number(val).toFixed(digits)
}

// SVG crescent disc that renders the actual illumination fraction
function PhaseDisc({ illumination, size = 96 }) {
  const r = size / 2
  const lit = Math.max(0, Math.min(100, illumination ?? 50)) / 100

  // Crescent geometry: inner ellipse x-radius scales from -r (new) to +r (full)
  // negative = crescent on left, positive = crescent on right
  const rx = r * Math.abs(2 * lit - 1)
  const sweep = lit >= 0.5 ? 1 : 0   // which arc of inner ellipse to show

  // Outer disc path (full circle, clockwise)
  // Inner ellipse path (counter-clockwise to cut out dark portion)
  const d = [
    `M ${r} 0`,
    `A ${r} ${r} 0 1 1 ${r} ${size}`,  // right semicircle (lit side always visible)
    `A ${r} ${r} 0 1 1 ${r} 0`,         // left semicircle
    'Z',
  ].join(' ')

  // The illuminated portion is built from:
  // - always the right half of the circle
  // - plus/minus an elliptical section depending on phase
  const litPath = [
    `M ${r} 0`,
    `A ${r} ${r} 0 0 1 ${r} ${size}`,   // right half of disc (top→bottom, clockwise)
    `A ${rx} ${r} 0 0 ${sweep} ${r} 0`, // inner ellipse back to top
    'Z',
  ].join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Dark side */}
      <circle cx={r} cy={r} r={r} fill="var(--dark)" opacity="0.18" />
      {/* Lit crescent */}
      <path d={litPath} fill="var(--steel)" />
      {/* Subtle border */}
      <circle cx={r} cy={r} r={r - 1} fill="none" stroke="var(--border)" strokeWidth="1.5" />
    </svg>
  )
}

export default function VenusHero({ data, loading, error }) {
  return (
    <div className="card" style={{
      background: 'var(--sand)',
      textAlign: 'center',
      padding: '36px 24px 32px',
    }}>
      {loading && <p className="loading">Loading Venus data…</p>}
      {error && <p className="error">{error}</p>}

      {data && (
        <>
          {/* Phase disc */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <PhaseDisc illumination={data.illumination} size={100} />
          </div>

          {/* Name */}
          <h2 style={{
            fontSize: '2.4rem',
            letterSpacing: '0.04em',
            color: 'var(--dark)',
            marginBottom: 4,
          }}>
            Venus
          </h2>

          {/* Zodiac + visibility */}
          <div style={{
            fontSize: '1rem',
            color: 'var(--dark-muted)',
            marginBottom: 6,
          }}>
            {data.zodiac}
          </div>

          <div style={{
            display: 'inline-block',
            padding: '3px 14px',
            borderRadius: 20,
            background: data.is_evening_star ? 'var(--yellow-green)' : 'var(--sage)',
            fontSize: '0.78rem',
            color: 'var(--dark)',
            letterSpacing: '0.05em',
            marginBottom: 20,
          }}>
            {data.is_evening_star ? 'Evening Star' : 'Morning Star'}
          </div>

          {/* Phase description */}
          <p style={{
            fontSize: '0.88rem',
            color: 'var(--dark-muted)',
            marginBottom: 28,
            fontStyle: 'italic',
          }}>
            {data.phase}
          </p>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '12px 32px',
            borderTop: '1px solid var(--border)',
            paddingTop: 20,
          }}>
            <Stat label="Elongation"   value={`${fmt(data.elongation)}°`} />
            <Stat label="Illumination" value={`${fmt(data.illumination)}%`} />
            <Stat label="Magnitude"    value={fmt(data.magnitude, 1)} />
            <Stat label="Altitude"     value={`${fmt(data.altitude)}°`} />
            <Stat label="Azimuth"      value={`${fmt(data.azimuth)}°`} />
            <Stat label="Distance"     value={`${fmt(data.distance_au, 3)} AU`} />
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ minWidth: 72 }}>
      <div style={{
        fontSize: '0.6rem',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--dark-muted)',
        marginBottom: 2,
      }}>
        {label}
      </div>
      <div style={{ fontSize: '1rem', color: 'var(--dark)', fontWeight: 500 }}>
        {value}
      </div>
    </div>
  )
}
