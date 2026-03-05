import { useState, useEffect } from 'react'

const CREAM = '#F5EDD0'
const MUTED = 'rgba(245,237,208,0.45)'
const SAGE = '#C5C9A8'
const CARD_BG = 'rgba(61,61,46,0.7)'
const GOLD = '#c8b870'

const STORAGE_KEY = 'venus_observation_log'

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    })
  } catch { return iso }
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch { return '' }
}

const CONDITIONS = ['Clear', 'Partly Cloudy', 'Hazy', 'Light Pollution', 'Cloudy']
const RATINGS = [
  { value: 5, label: 'Stunning' },
  { value: 4, label: 'Great' },
  { value: 3, label: 'Good' },
  { value: 2, label: 'Fair' },
  { value: 1, label: 'Poor' },
]

function NewEntryForm({ venusData, onSave, onCancel }) {
  const [notes, setNotes] = useState('')
  const [condition, setCondition] = useState('Clear')
  const [rating, setRating] = useState(4)
  const [naked, setNaked] = useState(true)

  function handleSave() {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      notes: notes.trim(),
      condition,
      rating,
      naked_eye: naked,
      venus: venusData ? {
        altitude: venusData.altitude,
        azimuth: venusData.azimuth,
        elongation: venusData.elongation,
        magnitude: venusData.magnitude,
        illumination: venusData.illumination,
        phase: venusData.phase,
        zodiac: venusData.zodiac,
        is_evening_star: venusData.is_evening_star,
      } : null,
    }
    onSave(entry)
  }

  return (
    <div style={{
      background: CARD_BG, borderRadius: 12, padding: '16px 16px 14px',
      border: `1px solid rgba(200,184,112,0.25)`, marginBottom: 16,
    }}>
      <div style={{
        fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em',
        color: GOLD, marginBottom: 12,
      }}>
        New Observation
      </div>

      {/* Auto-captured Venus data */}
      {venusData && (
        <div style={{
          background: 'rgba(200,184,112,0.08)', borderRadius: 8, padding: '10px 12px',
          marginBottom: 12, fontSize: '0.72rem', color: MUTED, lineHeight: 1.6,
        }}>
          <span style={{ color: CREAM }}>{venusData.is_evening_star ? 'Evening Star' : 'Morning Star'}</span>
          {' \u00B7 '}
          {venusData.zodiac}
          {' \u00B7 '}
          Alt {venusData.altitude?.toFixed(1)}\u00B0
          {' \u00B7 '}
          Mag {venusData.magnitude?.toFixed(1)}
          {' \u00B7 '}
          {venusData.phase}
        </div>
      )}

      {/* Conditions */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.68rem', color: MUTED, marginBottom: 6, letterSpacing: '0.04em' }}>Sky Conditions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CONDITIONS.map(c => (
            <button key={c} onClick={() => setCondition(c)} style={{
              padding: '5px 11px', borderRadius: 20,
              fontSize: '0.72rem', cursor: 'pointer',
              background: condition === c ? 'rgba(197,201,168,0.2)' : 'rgba(61,61,46,0.5)',
              border: `1px solid ${condition === c ? 'rgba(197,201,168,0.5)' : 'rgba(255,255,255,0.1)'}`,
              color: condition === c ? SAGE : MUTED,
              fontWeight: condition === c ? 600 : 400,
            }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.68rem', color: MUTED, marginBottom: 6, letterSpacing: '0.04em' }}>Viewing Quality</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {RATINGS.map(r => (
            <button key={r.value} onClick={() => setRating(r.value)} style={{
              padding: '5px 11px', borderRadius: 20,
              fontSize: '0.72rem', cursor: 'pointer',
              background: rating === r.value ? 'rgba(197,201,168,0.2)' : 'rgba(61,61,46,0.5)',
              border: `1px solid ${rating === r.value ? 'rgba(197,201,168,0.5)' : 'rgba(255,255,255,0.1)'}`,
              color: rating === r.value ? SAGE : MUTED,
              fontWeight: rating === r.value ? 600 : 400,
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment toggle */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ val: true, label: 'Naked Eye' }, { val: false, label: 'Binoculars / Telescope' }].map(opt => (
            <button key={String(opt.val)} onClick={() => setNaked(opt.val)} style={{
              padding: '5px 11px', borderRadius: 20,
              fontSize: '0.72rem', cursor: 'pointer',
              background: naked === opt.val ? 'rgba(197,201,168,0.2)' : 'rgba(61,61,46,0.5)',
              border: `1px solid ${naked === opt.val ? 'rgba(197,201,168,0.5)' : 'rgba(255,255,255,0.1)'}`,
              color: naked === opt.val ? SAGE : MUTED,
              fontWeight: naked === opt.val ? 600 : 400,
            }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <textarea
        placeholder="What did you observe? How did Venus look?"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={3}
        style={{
          width: '100%', padding: '10px 12px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, color: CREAM,
          fontSize: '16px', // prevent iOS zoom
          fontFamily: 'inherit', resize: 'vertical',
          outline: 'none', marginBottom: 14,
        }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSave} style={{
          flex: 1, padding: '11px 16px', borderRadius: 8,
          background: SAGE, border: 'none', color: '#1a1a14',
          fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
        }}>
          Save Observation
        </button>
        <button onClick={onCancel} style={{
          padding: '11px 16px', borderRadius: 8,
          background: 'none', border: '1px solid rgba(255,255,255,0.15)',
          color: MUTED, fontSize: '0.82rem', cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function EntryCard({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const ratingLabel = RATINGS.find(r => r.value === entry.rating)?.label || ''

  return (
    <div style={{
      background: CARD_BG, borderRadius: 12, padding: '14px 16px',
      border: '0.5px solid rgba(255,255,255,0.07)', marginBottom: 10,
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <div>
          <div style={{ fontSize: '0.82rem', color: CREAM, fontWeight: 500 }}>
            {formatDate(entry.timestamp)}
          </div>
          <div style={{ fontSize: '0.7rem', color: MUTED, marginTop: 2 }}>
            {formatTime(entry.timestamp)}
            {entry.condition ? ` \u00B7 ${entry.condition}` : ''}
            {ratingLabel ? ` \u00B7 ${ratingLabel}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {entry.venus && (
            <span style={{
              fontSize: '0.62rem', padding: '2px 8px', borderRadius: 10,
              background: entry.venus.is_evening_star ? 'rgba(229,232,196,0.15)' : 'rgba(197,201,168,0.15)',
              color: entry.venus.is_evening_star ? '#E5E8C4' : SAGE,
              border: `1px solid ${entry.venus.is_evening_star ? 'rgba(229,232,196,0.3)' : 'rgba(197,201,168,0.3)'}`,
            }}>
              {entry.venus.is_evening_star ? 'Evening' : 'Morning'}
            </span>
          )}
          <span style={{ color: MUTED, fontSize: '0.8rem', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
            &#x203A;
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {entry.notes && (
            <p style={{ fontSize: '0.82rem', color: CREAM, lineHeight: 1.6, margin: '0 0 10px' }}>
              {entry.notes}
            </p>
          )}

          {entry.venus && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '4px 14px',
              fontSize: '0.7rem', color: MUTED, marginBottom: 10,
            }}>
              <span>{entry.venus.zodiac}</span>
              <span>Alt {entry.venus.altitude?.toFixed(1)}\u00B0</span>
              <span>Elong {entry.venus.elongation?.toFixed(1)}\u00B0</span>
              <span>Mag {entry.venus.magnitude?.toFixed(1)}</span>
              <span>Illum {entry.venus.illumination?.toFixed(0)}%</span>
              <span>{entry.naked_eye ? 'Naked Eye' : 'Optics'}</span>
            </div>
          )}

          <button onClick={() => onDelete(entry.id)} style={{
            background: 'none', border: 'none', color: '#C0826A',
            fontSize: '0.72rem', cursor: 'pointer', padding: 0,
          }}>
            Delete entry
          </button>
        </div>
      )}
    </div>
  )
}

export default function LogPage({ venusData }) {
  const [entries, setEntries] = useState(loadEntries)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { saveEntries(entries) }, [entries])

  function handleSave(entry) {
    setEntries(prev => [entry, ...prev])
    setShowForm(false)
  }

  function handleDelete(id) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const totalObs = entries.length
  const streak = (() => {
    if (!entries.length) return 0
    let count = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let d = 0; d < 365; d++) {
      const check = new Date(today)
      check.setDate(check.getDate() - d)
      const dayStr = check.toISOString().slice(0, 10)
      if (entries.some(e => e.timestamp.slice(0, 10) === dayStr)) {
        count++
      } else if (d > 0) {
        break
      }
      // skip today if no entry yet (don't break streak)
      if (d === 0 && !entries.some(e => e.timestamp.slice(0, 10) === dayStr)) continue
    }
    return count
  })()

  return (
    <main style={{
      paddingTop: 'max(16px, env(safe-area-inset-top))',
      paddingLeft: 16, paddingRight: 16,
      paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
      minHeight: '100vh',
      background: '#2B2B1C',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: CREAM, letterSpacing: '0.02em' }}>
            Observation Log
          </h2>
          <p style={{ fontSize: '0.72rem', color: MUTED, margin: '2px 0 0' }}>
            {totalObs} observation{totalObs !== 1 ? 's' : ''}
            {streak > 1 ? ` \u00B7 ${streak}-day streak` : ''}
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            background: SAGE, border: 'none', borderRadius: 20,
            padding: '8px 16px', color: '#1a1a14',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Log
          </button>
        )}
      </div>

      {/* New entry form */}
      {showForm && (
        <NewEntryForm
          venusData={venusData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Empty state */}
      {entries.length === 0 && !showForm && (
        <div style={{
          textAlign: 'center', paddingTop: 60, paddingBottom: 60,
        }}>
          <div style={{ fontSize: '2.4rem', marginBottom: 12, opacity: 0.3 }}>&#9790;</div>
          <p style={{ fontSize: '0.92rem', color: CREAM, marginBottom: 6 }}>
            No observations yet
          </p>
          <p style={{ fontSize: '0.78rem', color: MUTED, lineHeight: 1.5, maxWidth: 260, margin: '0 auto' }}>
            Log your Venus sightings to track your observations over time. Each entry auto-captures current Venus data.
          </p>
        </div>
      )}

      {/* Entries list */}
      {entries.map(entry => (
        <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
      ))}
    </main>
  )
}
