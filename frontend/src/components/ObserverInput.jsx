import { useState, useEffect, useRef } from 'react'

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'VenusTracker/1.0' } })
  if (!res.ok) throw new Error('Geocoding request failed')
  const data = await res.json()
  if (!data.length) throw new Error('Location not found')
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    display: data[0].display_name,
  }
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      {/* Location search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={labelStyle}>LOCATION</span>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="e.g. Danville, Virginia"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ ...searchStyle, paddingRight: status === 'resolving' ? 28 : 8 }}
          />
          {status === 'resolving' && (
            <span style={spinnerStyle}>⟳</span>
          )}
        </div>
        {status === 'found' && resolved && (
          <span style={hintStyle} title={resolved.display}>
            {resolved.lat.toFixed(4)}, {resolved.lon.toFixed(4)}
          </span>
        )}
        {status === 'error' && (
          <span style={{ ...hintStyle, color: '#C0826A' }}>Location not found</span>
        )}
      </div>

      <button type="submit" style={btnStyle}>Update</button>
    </form>
  )
}

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  color: 'var(--sand)',
  fontSize: '0.65rem',
  letterSpacing: '0.1em',
}

const searchStyle = {
  width: 200,
  padding: '5px 8px',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 4,
  color: 'var(--cream)',
  fontSize: '0.85rem',
  outline: 'none',
}


const btnStyle = {
  padding: '5px 14px',
  marginBottom: 1,
  background: 'var(--sage)',
  border: 'none',
  borderRadius: 4,
  color: 'var(--dark)',
  fontSize: '0.8rem',
  cursor: 'pointer',
  letterSpacing: '0.06em',
  alignSelf: 'flex-end',
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
