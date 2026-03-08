import { useState, useEffect, useRef } from 'react'

let _lastGeocode = 0

async function geocode(query) {
  // Enforce 1 req/sec to respect Nominatim ToS
  const now = Date.now()
  const wait = Math.max(0, 1000 - (now - _lastGeocode))
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  _lastGeocode = Date.now()

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'VenusTracker/1.0' } })
  if (!res.ok) throw new Error('Geocoding request failed')
  const data = await res.json()
  if (!data.length) throw new Error('Location not found')
  const lat = parseFloat(data[0].lat)
  const lon = parseFloat(data[0].lon)
  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('Invalid coordinates returned')
  }
  return { lat, lon, display: data[0].display_name }
}

export default function ObserverInput({ lat, lon, onUpdate }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(null) // null | 'resolving' | 'found' | 'error'
  const [resolved, setResolved] = useState(null) // { lat, lon, display }
  const [pendingLat, setPendingLat] = useState(lat)
  const [pendingLon, setPendingLon] = useState(lon)
  const debounceRef = useRef(null)

  // Debounce geocoding as user types
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setStatus(null)
      setResolved(null)
      return
    }
    clearTimeout(debounceRef.current)
    setStatus('resolving')
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await geocode(q)
        setResolved(result)
        setPendingLat(parseFloat(result.lat.toFixed(5)))
        setPendingLon(parseFloat(result.lon.toFixed(5)))
        setStatus('found')
      } catch {
        setStatus('error')
        setResolved(null)
      }
    }, 600)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  function handleSubmit(e) {
    e.preventDefault()
    onUpdate(pendingLat, pendingLon)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search city or place..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ ...searchStyle, paddingRight: status === 'resolving' ? 32 : 10 }}
        />
        {status === 'resolving' && (
          <span style={spinnerStyle}>&#x27F3;</span>
        )}
      </div>
      {status === 'found' && resolved && (
        <span style={hintStyle} title={resolved.display}>
          {resolved.display.split(',').slice(0, 2).join(',')}
        </span>
      )}
      {status === 'error' && (
        <span style={{ ...hintStyle, color: '#C0826A' }}>Location not found</span>
      )}
      <button type="submit" style={btnStyle}>Update Location</button>
    </form>
  )
}


const searchStyle = {
  width: '100%',
  padding: '8px 10px',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 6,
  color: 'var(--cream)',
  fontSize: '16px', // prevents iOS viewport zoom on focus
  outline: 'none',
}


const btnStyle = {
  padding: '10px 14px',
  background: 'var(--sage)',
  border: 'none',
  borderRadius: 6,
  color: 'var(--dark)',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: '0.06em',
  width: '100%',
}

const hintStyle = {
  fontSize: '0.7rem',
  color: 'var(--sage)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 200,
}

const spinnerStyle = {
  position: 'absolute',
  right: 7,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--sage)',
  fontSize: '0.9rem',
  animation: 'spin 1s linear infinite',
  pointerEvents: 'none',
}
