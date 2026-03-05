import { useState } from 'react'
import ObserverInput from './ObserverInput.jsx'

function fmt(val, digits = 1) {
  if (val === null || val === undefined) return '\u2014'
  return Number(val).toFixed(digits)
}

// Realistic Venus globe with atmospheric cloud layers and illumination phase
function VenusGlobe({ illumination, size = 120 }) {
  const r = size / 2
  const lit = Math.max(0, Math.min(100, illumination ?? 50)) / 100

  // Shadow position: 0% illumination = fully shadowed, 100% = fully lit
  // Shadow slides from right to left as illumination increases
  const shadowOffset = (1 - lit) * size * 0.8

  return (
    <div style={{
      width: size, height: size, position: 'relative',
      borderRadius: '50%', overflow: 'hidden',
    }}>
      {/* Base Venus surface — warm golden atmosphere */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `
          radial-gradient(circle at 38% 35%,
            #F5E6C8 0%,
            #E8D5A8 20%,
            #D4C090 40%,
            #C4AD78 60%,
            #B89E68 80%,
            #A88E58 100%
          )
        `,
      }} />

      {/* Cloud band layers */}
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <clipPath id="venus-clip">
            <circle cx={r} cy={r} r={r} />
          </clipPath>
        </defs>
        <g clipPath="url(#venus-clip)">
          {/* Horizontal cloud bands with varying opacity */}
          {[0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88].map((yFrac, i) => (
            <ellipse
              key={i}
              cx={r + (i % 2 ? 3 : -3)}
              cy={size * yFrac}
              rx={r * (0.9 + Math.sin(i * 0.7) * 0.1)}
              ry={size * (0.02 + Math.sin(i * 1.2) * 0.008)}
              fill={i % 2 ? '#C8B480' : '#D8C898'}
              opacity={0.25 + Math.sin(i * 0.9) * 0.1}
            />
          ))}
          {/* Swirl details */}
          <ellipse cx={r * 0.7} cy={r * 0.6} rx={r * 0.15} ry={r * 0.08}
            fill="#C4A870" opacity="0.2" transform={`rotate(-15 ${r * 0.7} ${r * 0.6})`} />
          <ellipse cx={r * 1.3} cy={r * 1.2} rx={r * 0.12} ry={r * 0.06}
            fill="#CAAE78" opacity="0.18" transform={`rotate(10 ${r * 1.3} ${r * 1.2})`} />
        </g>
      </svg>

      {/* Atmospheric depth — subtle limb darkening */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `
          radial-gradient(circle at 42% 40%,
            transparent 40%,
            rgba(120, 100, 60, 0.15) 70%,
            rgba(80, 65, 35, 0.35) 90%,
            rgba(50, 40, 20, 0.5) 100%
          )
        `,
      }} />

      {/* Phase shadow — crescent darkness */}
      <div style={{
        position: 'absolute', inset: -2, borderRadius: '50%',
        background: `
          linear-gradient(to right,
            transparent ${lit * 100}%,
            rgba(13, 13, 8, 0.85) ${lit * 100 + 8}%,
            rgba(13, 13, 8, 0.95) 100%
          )
        `,
      }} />

      {/* Specular highlight — atmospheric shine */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `
          radial-gradient(circle at 35% 30%,
            rgba(255, 248, 220, 0.3) 0%,
            rgba(255, 248, 220, 0.1) 20%,
            transparent 50%
          )
        `,
      }} />

      {/* Outer atmospheric glow ring */}
      <div style={{
        position: 'absolute',
        inset: -3,
        borderRadius: '50%',
        border: '1.5px solid rgba(232, 214, 168, 0.3)',
        boxShadow: '0 0 12px rgba(232, 214, 168, 0.15), inset 0 0 8px rgba(232, 214, 168, 0.05)',
      }} />
    </div>
  )
}

export default function VenusHero({ data, loading, error, lat, lon, onUpdateLocation }) {
  const [showLocation, setShowLocation] = useState(false)

  return (
    <div className="card" style={{
      background: 'var(--sand)',
      textAlign: 'center',
      padding: '36px 24px 32px',
      position: 'relative',
    }}>
      {/* Location icon — top right */}
      <button
        onClick={() => setShowLocation(true)}
        style={{
          position: 'absolute', top: 14, right: 14,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 6, borderRadius: 8,
          color: 'var(--dark-muted)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
        aria-label="Set location"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>
          {lat === 0 && lon === 0 ? 'Set Location' : `${lat.toFixed(1)}, ${lon.toFixed(1)}`}
        </span>
      </button>

      {/* Location modal */}
      {showLocation && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowLocation(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(13, 13, 8, 0.7)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: 'max(80px, calc(env(safe-area-inset-top) + 60px))',
          }}
        >
          <div style={{
            background: '#3D3D2E', borderRadius: 12,
            padding: '20px 20px 16px', width: 'calc(100% - 40px)', maxWidth: 360,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 14,
            }}>
              <span style={{
                color: 'var(--sand)', fontSize: '0.7rem',
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                Observer Location
              </span>
              <button
                onClick={() => setShowLocation(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--sand)',
                  fontSize: '1.2rem', cursor: 'pointer', padding: '0 4px',
                }}
              >
                x
              </button>
            </div>
            <ObserverInput
              lat={lat} lon={lon}
              onUpdate={(newLat, newLon) => {
                onUpdateLocation(newLat, newLon)
                setShowLocation(false)
              }}
            />
          </div>
        </div>
      )}

      {loading && <p className="loading">Loading Venus data...</p>}
      {error && <p className="error">{error}</p>}

      {data && (
        <>
          {/* Venus globe */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <VenusGlobe illumination={data.illumination} size={120} />
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
            <Stat label="Elongation"   value={`${fmt(data.elongation)}\u00B0`} />
            <Stat label="Illumination" value={`${fmt(data.illumination)}%`} />
            <Stat label="Magnitude"    value={fmt(data.magnitude, 1)} />
            <Stat label="Altitude"     value={`${fmt(data.altitude)}\u00B0`} />
            <Stat label="Azimuth"      value={`${fmt(data.azimuth)}\u00B0`} />
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
