import { fmtDate } from '../utils.js'

function retrogradeStatus(calYear) {
  if (!calYear) return null
  const today = new Date()
  const start = calYear.retrograde_start ? new Date(calYear.retrograde_start + 'T12:00:00') : null
  const end   = calYear.retrograde_end   ? new Date(calYear.retrograde_end   + 'T12:00:00') : null

  if (start && end && today >= start && today <= end) {
    const daysLeft = Math.round((end - today) / 86_400_000)
    return { label: 'Retrograde ends', date: calYear.retrograde_end, days: daysLeft, active: true }
  }
  if (start && today < start) {
    const daysUntil = Math.round((start - today) / 86_400_000)
    return { label: 'Next retrograde', date: calYear.retrograde_start, days: daysUntil, active: false }
  }
  return null
}

export default function CalendarToday({ data, loading, error, calYear }) {
  const retro = retrogradeStatus(calYear)
  return (
    <div className="card">
      <div className="card-label">Today in the Venus Calendar</div>

      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '1.5rem', fontFamily: 'Georgia, serif', color: 'var(--dark)' }}>
            Month {data.venus_month}, Day {data.venus_day}
          </div>

          <div>
            <PhaseBadge phase={data.phase} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
            <SmallRow label="Next New Year" value={fmtDate(data.next_new_year)} />
            {data.next_holiday_name && (
              <SmallRow
                label={data.next_holiday_name}
                value={`${fmtDate(data.next_holiday_date)} · in ${data.next_holiday_days}d`}
              />
            )}
            {retro && (
              <SmallRow
                label={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {retro.active && (
                      <span style={{
                        display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                        background: '#A8B8C4', flexShrink: 0,
                      }} />
                    )}
                    {retro.label}
                  </span>
                }
                value={`${fmtDate(retro.date)} · in ${retro.days}d`}
                highlight={retro.active}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PhaseBadge({ phase }) {
  const colors = {
    'Morning Star':         { bg: '#C5C9A8', text: '#3D3D2E' },
    'Superior Conjunction': { bg: '#E8DEBB', text: '#3D3D2E' },
    'Evening Star':         { bg: '#E5E8C4', text: '#3D3D2E' },
    'Retrograde':           { bg: '#A8B8C4', text: '#3D3D2E' },
  }
  const c = colors[phase] || { bg: 'var(--border)', text: 'var(--dark)' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 12px',
      borderRadius: 20,
      background: c.bg,
      color: c.text,
      fontSize: '0.8rem',
      letterSpacing: '0.05em',
    }}>
      {phase}
    </span>
  )
}

function SmallRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', marginBottom: 4,
      ...(highlight ? { background: 'var(--steel)', borderRadius: 4, padding: '2px 6px', margin: '4px -6px' } : {}),
    }}>
      <span style={{ color: highlight ? 'var(--dark)' : 'var(--dark-muted)', fontSize: '0.8rem' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--dark)', fontWeight: highlight ? 600 : 400 }}>{value}</span>
    </div>
  )
}
