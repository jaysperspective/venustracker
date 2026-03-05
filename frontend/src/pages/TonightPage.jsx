const CREAM = '#F5EDD0'
const MUTED = 'rgba(245,237,208,0.45)'
const SAGE = '#C5C9A8'
const STEEL = '#A8B8C4'
const CARD_BG = 'rgba(61,61,46,0.7)'
const GOLD = '#c8b870'

function visibilityScore(altitude, elongation, magnitude) {
  if (altitude <= 0) return { label: 'Below Horizon', color: '#8B6B6B', tip: null }
  if (altitude < 5) return { label: 'Very Low', color: '#C0826A', tip: 'Venus is very close to the horizon — find an unobstructed view' }
  if (elongation > 30 && altitude > 15) return { label: 'Excellent', color: SAGE, tip: null }
  if (elongation > 20 && altitude > 10) return { label: 'Great', color: SAGE, tip: null }
  if (altitude > 5) return { label: 'Visible', color: STEEL, tip: null }
  return { label: 'Fair', color: STEEL, tip: null }
}

function bearingToCompass(deg) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
}

function viewingTip(venusData) {
  if (!venusData) return null
  const { altitude, azimuth, is_evening_star, rise_time, set_time } = venusData
  const dir = bearingToCompass(azimuth)

  if (altitude <= 0 && is_evening_star) {
    return set_time
      ? `Venus has set for tonight. It set at ${set_time}.`
      : 'Venus is below the horizon. Try again closer to sunset.'
  }
  if (altitude <= 0 && !is_evening_star) {
    return rise_time
      ? `Venus rises at ${rise_time} tomorrow morning. Set an early alarm.`
      : 'Venus is below the horizon. Try again before dawn.'
  }
  if (is_evening_star) {
    return `Look ${dir} after sunset. Venus is ${altitude.toFixed(0)}\u00B0 above the horizon.`
  }
  return `Look ${dir} before sunrise. Venus is ${altitude.toFixed(0)}\u00B0 above the horizon.`
}

function moonProximity(venusData, moonData) {
  if (!venusData || !moonData) return null
  const dRa = venusData.ra - moonData.ra
  const dDec = venusData.dec - moonData.dec
  const sep = Math.sqrt(dRa * dRa + dDec * dDec)
  if (sep < 5) return { close: true, deg: sep.toFixed(1), text: `Moon is ${sep.toFixed(1)}\u00B0 from Venus \u2014 look for them together!` }
  if (sep < 15) return { close: false, deg: sep.toFixed(0), text: `Moon is ${sep.toFixed(0)}\u00B0 from Venus tonight` }
  return null
}

function HorizonDiagram({ altitude, azimuth, isEvening }) {
  const W = 320, H = 160
  const horizonY = H - 30

  // Map azimuth to x position (simplified: 180° range centered on viewing direction)
  const centerAz = azimuth
  const venusX = W / 2
  const venusY = Math.max(20, horizonY - (altitude / 90) * (horizonY - 20))
  const aboveHorizon = altitude > 0

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Sky gradient */}
      <defs>
        <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="70%" stopColor="#2d2d3f" />
          <stop offset="100%" stopColor="#3d3d4f" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={horizonY} fill="url(#sky-grad)" rx="8" />

      {/* Horizon line */}
      <line x1="0" y1={horizonY} x2={W} y2={horizonY} stroke="rgba(197,201,168,0.4)" strokeWidth="1.5" />
      <text x={W / 2} y={horizonY + 16} textAnchor="middle" fontSize="9" fill="rgba(245,237,208,0.35)" letterSpacing="2">
        HORIZON
      </text>

      {/* Compass labels */}
      <text x="12" y={horizonY - 6} fontSize="8" fill="rgba(245,237,208,0.3)">{bearingToCompass(centerAz - 40)}</text>
      <text x={W / 2} y={horizonY - 6} textAnchor="middle" fontSize="9" fill="rgba(245,237,208,0.5)" fontWeight="600">{bearingToCompass(centerAz)}</text>
      <text x={W - 12} y={horizonY - 6} textAnchor="end" fontSize="8" fill="rgba(245,237,208,0.3)">{bearingToCompass(centerAz + 40)}</text>

      {/* Altitude grid lines */}
      {[30, 60].map(alt => {
        const y = horizonY - (alt / 90) * (horizonY - 20)
        return (
          <g key={alt}>
            <line x1="20" y1={y} x2={W - 20} y2={y} stroke="rgba(245,237,208,0.08)" strokeWidth="0.5" strokeDasharray="4 4" />
            <text x={W - 16} y={y + 3} textAnchor="end" fontSize="7" fill="rgba(245,237,208,0.2)">{alt}\u00B0</text>
          </g>
        )
      })}

      {/* Venus */}
      {aboveHorizon && (
        <>
          <circle cx={venusX} cy={venusY} r="8" fill="rgba(200,184,112,0.15)" />
          <circle cx={venusX} cy={venusY} r="4" fill={GOLD} />
          <text x={venusX} y={venusY - 12} textAnchor="middle" fontSize="9" fill={CREAM} fontWeight="600">
            Venus
          </text>
          <text x={venusX} y={venusY + 18} textAnchor="middle" fontSize="8" fill="rgba(245,237,208,0.4)">
            {altitude.toFixed(1)}\u00B0 alt
          </text>
        </>
      )}

      {/* Below horizon indicator */}
      {!aboveHorizon && (
        <text x={W / 2} y={horizonY / 2 + 10} textAnchor="middle" fontSize="11" fill="rgba(245,237,208,0.25)">
          Venus is below the horizon
        </text>
      )}
    </svg>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: CARD_BG,
      borderRadius: 10,
      padding: '12px 14px',
      flex: '1 1 0',
      minWidth: 80,
    }}>
      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: MUTED, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: CREAM }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: MUTED, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function TonightPage({ venusData, moonData, sunData }) {
  const vis = venusData ? visibilityScore(venusData.altitude, venusData.elongation, venusData.magnitude) : null
  const tip = viewingTip(venusData)
  const moonInfo = moonProximity(venusData, moonData)

  return (
    <main style={{
      paddingTop: 'max(16px, env(safe-area-inset-top))',
      paddingLeft: 16, paddingRight: 16,
      paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
      minHeight: '100vh',
      background: '#2B2B1C',
    }}>
      {/* Header */}
      <h2 style={{
        margin: '0 0 4px', fontSize: '1rem', fontWeight: 600,
        color: CREAM, letterSpacing: '0.02em',
      }}>
        Tonight
      </h2>
      <p style={{ fontSize: '0.78rem', color: MUTED, margin: '0 0 18px' }}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {!venusData && (
        <p style={{ color: MUTED, fontStyle: 'italic', padding: '40px 0', textAlign: 'center' }}>
          Loading Venus data...
        </p>
      )}

      {venusData && (
        <>
          {/* Visibility badge */}
          {vis && (
            <div style={{
              background: 'rgba(200,184,112,0.1)',
              border: `1px solid rgba(200,184,112,0.25)`,
              borderRadius: 12, padding: '14px 16px', marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                  background: vis.color, color: '#1a1a14',
                  fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em',
                }}>
                  {vis.label}
                </span>
                <span style={{ fontSize: '0.78rem', color: CREAM }}>
                  {venusData.is_evening_star ? 'Evening Star' : 'Morning Star'}
                </span>
              </div>
              {tip && (
                <p style={{ fontSize: '0.88rem', color: CREAM, margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  {tip}
                </p>
              )}
              {vis.tip && (
                <p style={{ fontSize: '0.78rem', color: MUTED, margin: '6px 0 0', lineHeight: 1.4, fontStyle: 'italic' }}>
                  {vis.tip}
                </p>
              )}
            </div>
          )}

          {/* Horizon diagram */}
          <div style={{
            background: CARD_BG, borderRadius: 12, padding: '12px 12px 8px',
            marginBottom: 14, border: '0.5px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED, marginBottom: 8, paddingLeft: 4 }}>
              Sky Position
            </div>
            <HorizonDiagram
              altitude={venusData.altitude}
              azimuth={venusData.azimuth}
              isEvening={venusData.is_evening_star}
            />
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <StatCard
              label="Rise"
              value={venusData.rise_time || '\u2014'}
            />
            <StatCard
              label="Set"
              value={venusData.set_time || '\u2014'}
            />
            <StatCard
              label="Brightness"
              value={`${venusData.magnitude?.toFixed(1)}`}
              sub="magnitude"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <StatCard
              label="Direction"
              value={bearingToCompass(venusData.azimuth)}
              sub={`${venusData.azimuth?.toFixed(1)}\u00B0`}
            />
            <StatCard
              label="Altitude"
              value={`${venusData.altitude?.toFixed(1)}\u00B0`}
              sub={venusData.altitude > 0 ? 'above horizon' : 'below horizon'}
            />
            <StatCard
              label="Elongation"
              value={`${venusData.elongation?.toFixed(1)}\u00B0`}
              sub="from Sun"
            />
          </div>

          {/* Moon proximity */}
          {moonInfo && (
            <div style={{
              background: moonInfo.close ? 'rgba(168,184,196,0.12)' : CARD_BG,
              border: `1px solid ${moonInfo.close ? 'rgba(168,184,196,0.3)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12, padding: '12px 16px', marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>&#9790;</span>
                <div>
                  <div style={{ fontSize: '0.82rem', color: CREAM, fontWeight: moonInfo.close ? 600 : 400 }}>
                    {moonInfo.text}
                  </div>
                  {moonData?.phase && (
                    <div style={{ fontSize: '0.7rem', color: MUTED, marginTop: 2 }}>
                      {moonData.phase} \u00B7 {moonData.illumination?.toFixed(0)}% illuminated
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Observation tips */}
          <div style={{
            background: CARD_BG, borderRadius: 12, padding: '14px 16px',
            border: '0.5px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED, marginBottom: 10 }}>
              Observation Tips
            </div>
            {[
              venusData.is_evening_star
                ? 'Best viewed 20\u201345 minutes after sunset, before the sky gets too dark'
                : 'Best viewed 20\u201345 minutes before sunrise, as the sky begins to lighten',
              venusData.magnitude < -4
                ? 'Venus is exceptionally bright right now \u2014 visible even in twilight'
                : 'Look for the brightest point of light near the horizon',
              'Find an unobstructed view toward the ' + (venusData.is_evening_star ? 'western' : 'eastern') + ' horizon',
              venusData.elongation > 40
                ? 'Venus is near greatest elongation \u2014 this is peak viewing season'
                : venusData.elongation < 10
                  ? 'Venus is close to the Sun \u2014 difficult to observe right now'
                  : 'Binoculars can help spot Venus in brighter twilight skies',
            ].map((t, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, marginBottom: i < 3 ? 8 : 0,
                fontSize: '0.8rem', color: CREAM, lineHeight: 1.5,
              }}>
                <span style={{ color: GOLD, flexShrink: 0 }}>\u2022</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
