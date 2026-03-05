import { fmtDate } from '../utils.js'

const PHASE_ORDER = ['Morning Star', 'Superior Conjunction', 'Evening Star', 'Retrograde']
const PHASE_COLORS = {
  'Morning Star':         '#C5C9A8',
  'Superior Conjunction': '#E8DEBB',
  'Evening Star':         '#E5E8C4',
  'Retrograde':           '#A8B8C4',
}

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

function holidayProgress(data, calYear) {
  if (!data || !calYear?.holidays) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Sort holidays chronologically and find the next upcoming one
  const sorted = calYear.holidays
    .filter(h => h.gregorian_date)
    .map(h => ({ ...h, date: new Date(h.gregorian_date + 'T00:00:00') }))
    .sort((a, b) => a.date - b.date)

  const nextHoliday = sorted.find(h => h.date > today)
  if (!nextHoliday) return null

  // Find the previous holiday (or year start) as the anchor
  const pastHolidays = sorted.filter(h => h.date <= today)
  const prevDate = pastHolidays.length
    ? pastHolidays[pastHolidays.length - 1].date
    : calYear.new_year_date
      ? new Date(calYear.new_year_date + 'T00:00:00')
      : null

  if (!prevDate) return null

  const totalDays = (nextHoliday.date - prevDate) / 86_400_000
  const elapsed = (today - prevDate) / 86_400_000
  const pct = totalDays > 0 ? Math.max(0, Math.min(100, (elapsed / totalDays) * 100)) : 0
  const daysLeft = Math.max(0, Math.round((nextHoliday.date - today) / 86_400_000))

  return { pct, daysLeft, holidayName: nextHoliday.name, currentPhase: data.phase }
}

export default function CalendarToday({ data, loading, error, calYear }) {
  const retro = retrogradeStatus(calYear)
  const progress = holidayProgress(data, calYear)

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

          {/* Phase progress bar */}
          {progress && (
            <div style={{ marginTop: 4 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.7rem', color: 'var(--dark-muted)', marginBottom: 5,
              }}>
                <span>{progress.currentPhase}</span>
                <span>{progress.daysLeft}d to {progress.holidayName}</span>
              </div>
              <div style={{
                width: '100%', height: 6, borderRadius: 3,
                background: 'var(--border)', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress.pct}%`, height: '100%', borderRadius: 3,
                  background: PHASE_COLORS[progress.currentPhase] || 'var(--sage)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
            <SmallRow label="Next New Year" value={fmtDate(data.next_new_year)} />
            {data.next_holiday_name && (
              <SmallRow
                label={data.next_holiday_name}
                value={`${fmtDate(data.next_holiday_date)} \u00B7 in ${data.next_holiday_days}d`}
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
                value={`${fmtDate(retro.date)} \u00B7 in ${retro.days}d`}
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
  const c = PHASE_COLORS[phase]
    ? { bg: PHASE_COLORS[phase], text: '#3D3D2E' }
    : { bg: 'var(--border)', text: 'var(--dark)' }
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
