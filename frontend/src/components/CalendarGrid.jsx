import { useState } from 'react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtShort(iso) {
  if (!iso) return { day: '', year: '' }
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  return { day: `${MONTHS[+m - 1]} ${+d}`, year: y }
}

function fmtReadable(iso) {
  if (!iso) return ''
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  return `${MONTHS[+m - 1]} ${+d}, ${y}`
}

const PHASE_COLORS = {
  'Morning Star':         '#C5C9A8',
  'Superior Conjunction': '#E8DEBB',
  'Evening Star':         '#E5E8C4',
  'Retrograde':           '#A8B8C4',
}

function phaseColor(phase) {
  return PHASE_COLORS[phase] || '#E8DEBB'
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const TODAY = new Date().toISOString().slice(0, 10)

function isCurrent(month) {
  return month.start_date <= TODAY && TODAY <= month.end_date
}

export default function CalendarGrid({ data, loading, error }) {
  const [selectedMonth, setSelectedMonth] = useState(null)

  return (
    <div className="card">
      <div className="card-label">
        {data ? `Venus Year ${data.year_number} — 13-Month Calendar` : 'Venus Calendar'}
      </div>

      {loading && <p className="loading">Loading calendar...</p>}
      {error && <p className="error">{error}</p>}

      {data && (
        <>
          <Legend />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginTop: 12,
          }}>
            {data.months.map(month => (
              <MonthCard
                key={month.number}
                month={month}
                holidays={data.holidays.filter(h => h.month === month.number)}
                isCurrent={isCurrent(month)}
                onClick={() => setSelectedMonth(month)}
              />
            ))}
          </div>

          {data.holidays.length > 0 && (
            <HolidayList holidays={data.holidays} />
          )}
        </>
      )}

      {selectedMonth && data && (
        <MonthDetailSheet
          month={selectedMonth}
          holidays={data.holidays.filter(h => h.month === selectedMonth.number)}
          onClose={() => setSelectedMonth(null)}
        />
      )}
    </div>
  )
}

function MonthCard({ month, holidays, isCurrent, onClick }) {
  const bg = phaseColor(month.phase)
  const { day, year } = fmtShort(month.start_date)
  return (
    <div
      onClick={onClick}
      style={{
        background: bg,
        border: isCurrent ? '2px solid #3D3D2E' : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 8,
        padding: isCurrent ? '9px 11px' : '10px 12px',
        boxShadow: isCurrent ? 'inset 0 0 0 1px rgba(255,255,255,0.4), 0 2px 8px rgba(61,61,46,0.25)' : 'none',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5A5A40' }}>
          M{month.number}
        </span>
        {isCurrent && (
          <span style={{
            fontSize: '0.52rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#3D3D2E',
            background: 'rgba(61,61,46,0.15)',
            borderRadius: 4,
            padding: '1px 5px',
          }}>
            Now
          </span>
        )}
      </div>
      <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#3D3D2E', lineHeight: 1.2 }}>
        {day}
      </div>
      <div style={{ fontSize: '0.62rem', color: '#6B6B52', marginBottom: 2 }}>
        {year}
      </div>

      {holidays.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 5 }}>
          {holidays.map((h, i) => (
            <span key={i} title={h.name} style={{
              display: 'inline-block',
              width: 6, height: 6,
              borderRadius: '50%',
              background: '#3D3D2E',
              opacity: 0.6,
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

function MonthDetailSheet({ month, holidays, onClose }) {
  const bg = phaseColor(month.phase)
  const bgTint = hexToRgba(bg, 0.18)
  const start = new Date(month.start_date + 'T00:00:00')

  const todayDayNum = (() => {
    if (TODAY < month.start_date || TODAY > month.end_date) return null
    return Math.floor((new Date(TODAY + 'T00:00:00') - start) / 86400000) + 1
  })()

  const days = Array.from({ length: month.days }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const [, m, day] = iso.split('-')
    const holiday = holidays.find(h => h.day === i + 1)
    return { number: i + 1, label: `${MONTHS[+m - 1]} ${+day}`, holiday }
  })

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 200,
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        maxHeight: '82vh',
        background: '#F5EDD0',
        borderRadius: '18px 18px 0 0',
        zIndex: 201,
        overflowY: 'auto',
        padding: '0 16px 100px',
      }}>
        {/* Pull handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(61,61,46,0.2)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingTop: 4 }}>
          <div>
            <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.13em', color: '#6B6B52', marginBottom: 3 }}>
              Month {month.number} · {month.phase}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#3D3D2E' }}>
              {fmtReadable(month.start_date)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6B6B52' }}>
              through {fmtReadable(month.end_date)}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(61,61,46,0.1)',
            border: 'none', borderRadius: '50%',
            width: 28, height: 28,
            cursor: 'pointer', color: '#3D3D2E',
            fontSize: '0.8rem', lineHeight: '28px', textAlign: 'center',
          }}>✕</button>
        </div>

        {/* Day grid — 7 columns × ~7 rows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {days.map(({ number, label, holiday }) => {
            const isToday = number === todayDayNum
            return (
              <div key={number} style={{
                background: isToday ? '#3D3D2E' : holiday ? bg : bgTint,
                border: holiday && !isToday ? '1px solid rgba(61,61,46,0.2)' : '1px solid transparent',
                borderRadius: 6,
                padding: '5px 2px 4px',
                textAlign: 'center',
                position: 'relative',
              }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#F5EDD0' : '#3D3D2E',
                  lineHeight: 1,
                }}>
                  {number}
                </div>
                <div style={{
                  fontSize: '0.42rem',
                  color: isToday ? 'rgba(245,237,208,0.65)' : '#6B6B52',
                  marginTop: 2,
                  lineHeight: 1.1,
                }}>
                  {label}
                </div>
                {holiday && (
                  <div style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 3, height: 3, borderRadius: '50%',
                    background: isToday ? '#F5EDD0' : '#3D3D2E',
                    opacity: 0.7,
                  }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Holidays in this month */}
        {holidays.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(61,61,46,0.15)' }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.13em', color: '#6B6B52', marginBottom: 8 }}>
              Holidays this month
            </div>
            {holidays.map((h, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                fontSize: '0.8rem', color: '#3D3D2E', marginBottom: 6,
              }}>
                <span>Day {h.day} · <strong>{h.name}</strong></span>
                <span style={{ color: '#6B6B52', fontSize: '0.72rem', marginLeft: 8 }}>{fmtReadable(h.gregorian_date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function Legend() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
      {Object.entries(PHASE_COLORS).map(([phase, color]) => (
        <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            display: 'inline-block', width: 12, height: 12, borderRadius: 3,
            background: color, border: '1px solid rgba(0,0,0,0.1)',
          }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--dark-muted)' }}>{phase}</span>
        </div>
      ))}
    </div>
  )
}

function HolidayList({ holidays }) {
  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--dark-muted)', marginBottom: 8 }}>
        Holidays
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 32px' }}>
        {holidays.map((h, i) => (
          <div key={i} style={{ fontSize: '0.8rem', color: 'var(--dark)' }}>
            <span>{h.name}</span>
            <span style={{ color: 'var(--dark-muted)' }}> — {fmtReadable(h.gregorian_date)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
