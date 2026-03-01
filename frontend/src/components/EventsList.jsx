import { fmtDate } from '../utils.js'

export default function EventsList({ data, loading, error }) {
  const today = new Date()

  return (
    <div className="card">
      <div className="card-label">Upcoming Venus Events</div>

      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}

      {data && data.length === 0 && (
        <p style={{ color: 'var(--dark-muted)', fontSize: '0.85rem' }}>No events found.</p>
      )}

      {data && data.length > 0 && (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.slice(0, 8).map((ev, i) => {
            // ev.date is now a clean ISO string "YYYY-MM-DD" from the backend
            const evDate = new Date(ev.date + 'T12:00:00')
            const days = Math.round((evDate - today) / 86_400_000)
            return (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--steel)',
                  marginTop: 6,
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--dark)', fontWeight: 500 }}>
                    {ev.event.replace(/\s*\([^)]*\)/g, '')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dark-muted)' }}>
                    {fmtDate(ev.date)}
                    {days >= 0 ? ` · in ${days}d` : ''}
                    {ev.elongation_deg != null ? ` · ${Number(ev.elongation_deg).toFixed(1)}°` : ''}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
