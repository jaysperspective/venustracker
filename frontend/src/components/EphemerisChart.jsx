// Orbital diagram showing the current Sun-Earth-Venus geometry
// and illustrating what "elongation" means visually.

const W = 380
const H = 260
const CX = W / 2       // diagram center x (= Sun)
const CY = H / 2 + 8  // diagram center y

const R_E = 104   // Earth's orbit radius (px)
const R_V = 75    // Venus's orbit radius (px, 0.72 × R_E)

const SUN_R   = 15
const EARTH_R = 6
const VENUS_R = 5

// Earth is placed to the right of Sun
const EARTH_X = CX + R_E
const EARTH_Y = CY

function calcVenusPos(elongDeg, isEvening) {
  const e   = (elongDeg * Math.PI) / 180
  const rv  = R_V / R_E  // ratio
  const disc = rv * rv - Math.sin(e) * Math.sin(e)
  if (disc < 0) return null

  // Distance from Earth to Venus along the elongation direction
  const t = R_E * (Math.cos(e) - Math.sqrt(disc))

  const vx = EARTH_X - t * Math.cos(e)
  const vy = EARTH_Y + (isEvening ? -1 : 1) * t * Math.sin(e)
  return { x: vx, y: vy }
}

function ElongationArc({ venus }) {
  if (!venus) return null
  const ARC_R = 28

  // Start: direction from Earth → Sun (pointing left)
  const startX = EARTH_X - ARC_R
  const startY = EARTH_Y

  // End: direction from Earth → Venus, at ARC_R distance
  const dx = venus.x - EARTH_X
  const dy = venus.y - EARTH_Y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const endX = EARTH_X + (dx / dist) * ARC_R
  const endY = EARTH_Y + (dy / dist) * ARC_R

  // sweep-flag: 0 = counter-clockwise (evening, above), 1 = clockwise (morning, below)
  const sweep = venus.y >= EARTH_Y ? 1 : 0

  return (
    <path
      d={`M ${startX} ${startY} A ${ARC_R} ${ARC_R} 0 0 ${sweep} ${endX} ${endY}`}
      fill="none"
      stroke="var(--steel)"
      strokeWidth="1.5"
      strokeDasharray="3 2"
    />
  )
}

function OrbitDiagram({ elongation, isEvening }) {
  const venus = calcVenusPos(elongation, isEvening)

  // Mid-point of the elongation arc for the degree label
  const arcMidAngle = isEvening
    ? Math.PI - (elongation * Math.PI) / 180 / 2   // above
    : Math.PI + (elongation * Math.PI) / 180 / 2   // below
  const ARC_LABEL_R = 44
  const labelX = EARTH_X + ARC_LABEL_R * Math.cos(arcMidAngle)
  const labelY = EARTH_Y + ARC_LABEL_R * Math.sin(arcMidAngle) * (isEvening ? -1 : 1)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Earth orbit */}
      <circle
        cx={CX} cy={CY} r={R_E}
        fill="none" stroke="var(--sage)" strokeWidth="1" opacity="0.5"
      />

      {/* Venus orbit */}
      <circle
        cx={CX} cy={CY} r={R_V}
        fill="none" stroke="var(--steel)" strokeWidth="1" opacity="0.45"
      />

      {/* Line: Earth → Sun */}
      <line
        x1={EARTH_X} y1={EARTH_Y} x2={CX} y2={CY}
        stroke="var(--dark-muted)" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.5"
      />

      {/* Line: Earth → Venus */}
      {venus && (
        <line
          x1={EARTH_X} y1={EARTH_Y} x2={venus.x} y2={venus.y}
          stroke="var(--steel)" strokeWidth="1" strokeDasharray="4 3" opacity="0.7"
        />
      )}

      {/* Elongation arc at Earth */}
      <ElongationArc venus={venus} />

      {/* Sun glow */}
      <circle cx={CX} cy={CY} r={SUN_R + 8} fill="#E8C87520" />
      <circle cx={CX} cy={CY} r={SUN_R + 4} fill="#E8C87540" />

      {/* Sun */}
      <circle cx={CX} cy={CY} r={SUN_R} fill="#E8C875" />
      <text x={CX} y={CY - SUN_R - 5} textAnchor="middle" fontSize="9" fill="var(--dark-muted)">
        Sun
      </text>

      {/* Earth */}
      <circle cx={EARTH_X} cy={EARTH_Y} r={EARTH_R} fill="var(--sage)" />
      <text x={EARTH_X + 10} y={EARTH_Y + 4} fontSize="9" fill="var(--dark-muted)">Earth</text>

      {/* Venus */}
      {venus && (
        <>
          <circle cx={venus.x} cy={venus.y} r={VENUS_R} fill="var(--steel)" />
          <text
            x={venus.x + (venus.x < CX ? -9 : 9)}
            y={venus.y - 8}
            textAnchor={venus.x < CX ? 'end' : 'start'}
            fontSize="9"
            fill="var(--steel)"
          >
            Venus
          </text>
        </>
      )}

      {/* Elongation angle label */}
      {venus && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="var(--steel)"
        >
          {elongation.toFixed(1)}°
        </text>
      )}

    </svg>
  )
}

export default function EphemerisChart({ data, loading, error }) {
  return (
    <div className="card">
      <div className="card-label">Elongation — Current Orbital Geometry</div>

      {loading && <p className="loading">Loading…</p>}
      {error && <p className="error">{error}</p>}

      {data && (
        <OrbitDiagram
          elongation={data.elongation}
          isEvening={data.is_evening_star}
        />
      )}
    </div>
  )
}
