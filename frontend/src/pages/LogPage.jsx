import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchLog, postLog, deleteLog, logImageUrl,
  getDisplayName, setDisplayName as saveDisplayName,
  getAdminSecret, setAdminSecret as saveAdminSecret,
  fetchPending, approveLog, rejectLog, adminDeleteLog,
} from '../api.js'

const CREAM = '#F5EDD0'
const MUTED = 'rgba(245,237,208,0.45)'
const SAGE = '#C5C9A8'
const CARD_BG = 'rgba(61,61,46,0.7)'
const GOLD = '#c8b870'

const CONDITIONS = ['Clear', 'Partly Cloudy', 'Hazy', 'Light Pollution', 'Cloudy']
const RATINGS = [
  { value: 5, label: 'Stunning' },
  { value: 4, label: 'Great' },
  { value: 3, label: 'Good' },
  { value: 2, label: 'Fair' },
  { value: 1, label: 'Poor' },
]

const MAX_IMAGE_PX = 800

// ─── Image helpers ──────────────────────────────────────────────────────────

function resizeImage(file, maxPx = MAX_IMAGE_PX) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxPx || height > maxPx) {
          const ratio = Math.min(maxPx / width, maxPx / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Date formatting ────────────────────────────────────────────────────────

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

function timeAgo(iso) {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return formatDate(iso)
  } catch { return '' }
}

// ─── New Entry Form ─────────────────────────────────────────────────────────

function NewEntryForm({ venusData, onSave, onCancel, saving }) {
  const [notes, setNotes] = useState('')
  const [condition, setCondition] = useState('Clear')
  const [rating, setRating] = useState(4)
  const [naked, setNaked] = useState(true)
  const [image, setImage] = useState(null) // { preview, dataUrl }
  const [displayName, setDisplayName] = useState(getDisplayName)
  const fileRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUrl = await resizeImage(file)
      setImage({ preview: dataUrl, dataUrl })
    } catch { /* skip bad file */ }
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleSave() {
    if (displayName.trim()) saveDisplayName(displayName.trim())
    const venus = venusData ? {
      altitude: venusData.altitude,
      azimuth: venusData.azimuth,
      elongation: venusData.elongation,
      magnitude: venusData.magnitude,
      illumination: venusData.illumination,
      phase: venusData.phase,
      zodiac: venusData.zodiac,
      is_evening_star: venusData.is_evening_star,
    } : null
    onSave({
      display_name: displayName.trim(),
      notes: notes.trim(),
      condition,
      rating,
      naked_eye: naked,
      image: image?.dataUrl || null,
      venus,
    })
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

      {/* Display name */}
      <input
        type="text"
        placeholder="Your name (optional)"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        maxLength={40}
        style={{
          width: '100%', padding: '8px 10px', marginBottom: 12,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, color: CREAM,
          fontSize: '16px', outline: 'none',
        }}
      />

      {/* Auto-captured Venus data */}
      {venusData && (
        <div style={{
          background: 'rgba(200,184,112,0.08)', borderRadius: 8, padding: '10px 12px',
          marginBottom: 12, fontSize: '0.72rem', color: MUTED, lineHeight: 1.6,
        }}>
          <span style={{ color: CREAM }}>{venusData.is_evening_star ? 'Evening Star' : 'Morning Star'}</span>
          {' \u00B7 '}{venusData.zodiac}
          {' \u00B7 '}Alt {venusData.altitude?.toFixed(1)}{'\u00B0'}
          {' \u00B7 '}Mag {venusData.magnitude?.toFixed(1)}
          {' \u00B7 '}{venusData.phase}
        </div>
      )}

      {/* Conditions */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.68rem', color: MUTED, marginBottom: 6, letterSpacing: '0.04em' }}>Sky Conditions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CONDITIONS.map(c => (
            <button key={c} onClick={() => setCondition(c)} style={pillStyle(condition === c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.68rem', color: MUTED, marginBottom: 6, letterSpacing: '0.04em' }}>Viewing Quality</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {RATINGS.map(r => (
            <button key={r.value} onClick={() => setRating(r.value)} style={pillStyle(rating === r.value)}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* Equipment toggle */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ val: true, label: 'Naked Eye' }, { val: false, label: 'Binoculars / Telescope' }].map(opt => (
            <button key={String(opt.val)} onClick={() => setNaked(opt.val)} style={pillStyle(naked === opt.val)}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Single photo picker */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: '0.68rem', color: MUTED, marginBottom: 6, letterSpacing: '0.04em' }}>
          Photo (optional)
        </div>
        {image ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={image.preview}
              alt=""
              style={{
                maxWidth: '100%', maxHeight: 180, objectFit: 'cover',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <button
              onClick={() => setImage(null)}
              style={{
                position: 'absolute', top: -6, right: -6,
                width: 22, height: 22, borderRadius: '50%',
                background: '#C0826A', border: 'none', color: '#fff',
                fontSize: '0.7rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              x
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: 72, height: 72, borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px dashed rgba(255,255,255,0.15)',
              color: MUTED, fontSize: '1.5rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            +
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </div>

      {/* Notes */}
      <textarea
        placeholder="What did you observe? How did Venus look?"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={3}
        maxLength={2000}
        style={{
          width: '100%', padding: '10px 12px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, color: CREAM,
          fontSize: '16px', fontFamily: 'inherit', resize: 'vertical',
          outline: 'none', marginBottom: 14,
        }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1, padding: '11px 16px', borderRadius: 8,
            background: saving ? 'rgba(197,201,168,0.5)' : SAGE,
            border: 'none', color: '#1a1a14',
            fontSize: '0.85rem', fontWeight: 600,
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Posting...' : 'Share Observation'}
        </button>
        <button onClick={onCancel} disabled={saving} style={{
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

// ─── Image Lightbox ─────────────────────────────────────────────────────────

function Lightbox({ src, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, cursor: 'pointer',
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          maxWidth: '100%', maxHeight: '90vh',
          borderRadius: 8, objectFit: 'contain',
        }}
      />
    </div>
  )
}

// ─── Entry Card ─────────────────────────────────────────────────────────────

function EntryCard({ entry, isMine, isAdmin, onDelete, onAdminDelete, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [busy, setBusy] = useState(false)
  const ratingLabel = RATINGS.find(r => r.value === entry.rating)?.label || ''
  const venus = entry.venus_data || {}
  const authorName = entry.display_name || 'Anonymous Observer'
  const imgFile = entry.images?.[0]

  async function handleAction(fn) {
    setBusy(true)
    try { await fn(entry.id) } catch { /* handled upstream */ }
    setBusy(false)
  }

  return (
    <div style={{
      background: CARD_BG, borderRadius: 12, padding: '14px 16px',
      border: isMine ? '1px solid rgba(200,184,112,0.2)'
        : !entry.approved ? '1px solid rgba(200,160,80,0.3)'
        : '0.5px solid rgba(255,255,255,0.07)',
      marginBottom: 10,
    }}>
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {/* Pending badge */}
      {!entry.approved && (
        <div style={{
          fontSize: '0.6rem', color: '#e0b050', background: 'rgba(224,176,80,0.1)',
          padding: '3px 8px', borderRadius: 6, marginBottom: 8, display: 'inline-block',
        }}>
          Pending approval
        </div>
      )}

      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: '0.82rem', color: CREAM, fontWeight: 500 }}>
              {authorName}
            </span>
            {isMine && (
              <span style={{
                fontSize: '0.55rem', padding: '1px 6px', borderRadius: 8,
                background: 'rgba(200,184,112,0.15)', color: GOLD,
                border: '1px solid rgba(200,184,112,0.25)',
              }}>
                You
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.7rem', color: MUTED, marginTop: 1 }}>
            {timeAgo(entry.timestamp)}
            {entry.condition ? ` \u00B7 ${entry.condition}` : ''}
            {ratingLabel ? ` \u00B7 ${ratingLabel}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {venus.is_evening_star != null && (
            <span style={{
              fontSize: '0.62rem', padding: '2px 8px', borderRadius: 10,
              background: venus.is_evening_star ? 'rgba(229,232,196,0.15)' : 'rgba(197,201,168,0.15)',
              color: venus.is_evening_star ? '#E5E8C4' : SAGE,
              border: `1px solid ${venus.is_evening_star ? 'rgba(229,232,196,0.3)' : 'rgba(197,201,168,0.3)'}`,
            }}>
              {venus.is_evening_star ? 'Evening' : 'Morning'}
            </span>
          )}
          {imgFile && <span style={{ fontSize: '0.7rem', color: MUTED }}>1 photo</span>}
          <span style={{
            color: MUTED, fontSize: '0.8rem',
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s',
          }}>
            &#x203A;
          </span>
        </div>
      </div>

      {/* Preview image (collapsed) */}
      {imgFile && !expanded && (
        <div style={{ marginTop: 10 }}>
          <img
            src={logImageUrl(imgFile)}
            alt=""
            onClick={e => { e.stopPropagation(); setLightboxSrc(logImageUrl(imgFile)) }}
            style={{
              width: 80, height: 80, objectFit: 'cover',
              borderRadius: 8, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Full-size image */}
          {imgFile && (
            <div style={{ marginBottom: 12 }}>
              <img
                src={logImageUrl(imgFile)}
                alt=""
                onClick={() => setLightboxSrc(logImageUrl(imgFile))}
                style={{
                  maxWidth: '100%', maxHeight: 280, objectFit: 'cover',
                  borderRadius: 10, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </div>
          )}

          {entry.notes && (
            <p style={{ fontSize: '0.82rem', color: CREAM, lineHeight: 1.6, margin: '0 0 10px' }}>
              {entry.notes}
            </p>
          )}

          {venus.zodiac && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '4px 14px',
              fontSize: '0.7rem', color: MUTED, marginBottom: 10,
            }}>
              <span>{venus.zodiac}</span>
              {venus.altitude != null && <span>Alt {venus.altitude?.toFixed(1)}{'\u00B0'}</span>}
              {venus.elongation != null && <span>Elong {venus.elongation?.toFixed(1)}{'\u00B0'}</span>}
              {venus.magnitude != null && <span>Mag {venus.magnitude?.toFixed(1)}</span>}
              {venus.illumination != null && <span>Illum {venus.illumination?.toFixed(0)}%</span>}
              <span>{entry.naked_eye ? 'Naked Eye' : 'Optics'}</span>
            </div>
          )}

          <div style={{ fontSize: '0.68rem', color: MUTED }}>
            {formatDate(entry.timestamp)} at {formatTime(entry.timestamp)}
          </div>

          {/* User delete (own posts) */}
          {isMine && (
            <button
              onClick={() => handleAction(onDelete)}
              disabled={busy}
              style={linkBtnStyle('#C0826A', busy)}
            >
              {busy ? 'Deleting...' : 'Delete observation'}
            </button>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {!entry.approved && onApprove && (
                <button onClick={() => handleAction(onApprove)} disabled={busy} style={linkBtnStyle(SAGE, busy)}>
                  Approve
                </button>
              )}
              {!entry.approved && onReject && (
                <button onClick={() => handleAction(onReject)} disabled={busy} style={linkBtnStyle('#C0826A', busy)}>
                  Reject
                </button>
              )}
              {onAdminDelete && (
                <button onClick={() => handleAction(onAdminDelete)} disabled={busy} style={linkBtnStyle('#C0826A', busy)}>
                  Admin delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{
      background: CARD_BG, borderRadius: 12, padding: '14px 16px', marginBottom: 10,
    }}>
      {[80, 50, 100].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 14 : 10, width: `${w}%`,
          background: 'rgba(245,237,208,0.06)', borderRadius: 6,
          marginBottom: i < 2 ? 8 : 0,
          animation: 'pulse 1.4s ease-in-out infinite',
        }} />
      ))}
    </div>
  )
}

// ─── Admin Login ────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }) {
  const [secret, setSecret] = useState('')
  return (
    <div style={{
      background: CARD_BG, borderRadius: 12, padding: '16px',
      border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16,
    }}>
      <div style={{ fontSize: '0.68rem', color: MUTED, marginBottom: 8 }}>Enter admin secret</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="password"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          placeholder="Admin secret..."
          style={{
            flex: 1, padding: '8px 10px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, color: CREAM, fontSize: '16px', outline: 'none',
          }}
        />
        <button
          onClick={() => { saveAdminSecret(secret); onLogin() }}
          style={{
            padding: '8px 16px', borderRadius: 8,
            background: SAGE, border: 'none', color: '#1a1a14',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Login
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function LogPage({ venusData }) {
  const [tab, setTab] = useState('community') // 'community' | 'mine' | 'admin'
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [adminAuthed, setAdminAuthed] = useState(() => !!getAdminSecret())

  const deviceId = localStorage.getItem('vt_device_id') || ''
  const isAdmin = adminAuthed && !!getAdminSecret()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data
      if (tab === 'admin') {
        data = await fetchPending({ limit: 50 })
      } else {
        data = await fetchLog({ limit: 50, mine: tab === 'mine' })
      }
      setEntries(data.entries || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tab, adminAuthed]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  async function handleSave(observation) {
    setSaving(true)
    try {
      await postLog(observation)
      setShowForm(false)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(obsId) {
    await deleteLog(obsId)
    setEntries(prev => prev.filter(e => e.id !== obsId))
    setTotal(prev => prev - 1)
  }

  async function handleAdminDelete(obsId) {
    await adminDeleteLog(obsId)
    setEntries(prev => prev.filter(e => e.id !== obsId))
    setTotal(prev => prev - 1)
  }

  async function handleApprove(obsId) {
    await approveLog(obsId)
    setEntries(prev => prev.filter(e => e.id !== obsId))
    setTotal(prev => prev - 1)
  }

  async function handleReject(obsId) {
    await rejectLog(obsId)
    setEntries(prev => prev.filter(e => e.id !== obsId))
    setTotal(prev => prev - 1)
  }

  const tabs = [
    { id: 'community', label: 'Community' },
    { id: 'mine', label: 'My Observations' },
    ...(isAdmin ? [{ id: 'admin', label: `Pending (${tab === 'admin' ? total : '...'})` }] : []),
  ]

  return (
    <main style={{
      paddingTop: 'max(16px, env(safe-area-inset-top))',
      paddingLeft: 16, paddingRight: 16,
      paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
      minHeight: '100vh',
      background: '#2B2B1C',
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: CREAM, letterSpacing: '0.02em' }}>
            Observation Log
          </h2>
          <p style={{ fontSize: '0.72rem', color: MUTED, margin: '2px 0 0' }}>
            {tab === 'admin'
              ? `${total} pending`
              : `${total} observation${total !== 1 ? 's' : ''}${tab === 'community' ? ' from the community' : ''}`
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isAdmin && (
            <button
              onClick={() => { setTab('admin'); setAdminAuthed(false) }}
              title="Admin"
              style={{
                background: 'none', border: 'none', color: MUTED,
                fontSize: '0.7rem', cursor: 'pointer', padding: 4, opacity: 0.4,
              }}
            >
              &#9881;
            </button>
          )}
          {!showForm && tab !== 'admin' && (
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
      </div>

      {/* Tab pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? 'rgba(197,201,168,0.18)' : 'rgba(61,61,46,0.5)',
              border: `1px solid ${tab === t.id ? 'rgba(197,201,168,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 20, padding: '6px 14px',
              color: tab === t.id ? SAGE : MUTED,
              fontSize: '0.78rem', fontWeight: tab === t.id ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Admin login */}
      {tab === 'admin' && !adminAuthed && (
        <AdminLogin onLogin={() => { setAdminAuthed(true); load() }} />
      )}

      {/* New entry form */}
      {showForm && tab !== 'admin' && (
        <NewEntryForm
          venusData={venusData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}

      {/* Submission notice */}
      {showForm && (
        <div style={{
          fontSize: '0.68rem', color: MUTED, marginBottom: 12,
          fontStyle: 'italic', textAlign: 'center',
        }}>
          Observations are reviewed before appearing in the community feed.
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(200,80,80,0.12)', border: '1px solid rgba(200,80,80,0.3)',
          borderRadius: 10, padding: '12px 16px', color: '#E8A0A0',
          fontSize: '0.82rem', marginBottom: 12,
        }}>
          {tab === 'admin' && error.includes('403')
            ? 'Invalid admin secret.'
            : `Failed to load: ${error}`}
          <button
            onClick={tab === 'admin' ? () => setAdminAuthed(false) : load}
            style={{
              marginLeft: 10, background: 'none', border: '1px solid rgba(200,80,80,0.4)',
              borderRadius: 6, padding: '3px 10px', color: '#E8A0A0',
              fontSize: '0.72rem', cursor: 'pointer',
            }}
          >
            {tab === 'admin' ? 'Re-enter secret' : 'Retry'}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}

      {/* Empty state */}
      {!loading && entries.length === 0 && !error && (
        <div style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 60 }}>
          <div style={{ fontSize: '2.4rem', marginBottom: 12, opacity: 0.3 }}>&#9790;</div>
          <p style={{ fontSize: '0.92rem', color: CREAM, marginBottom: 6 }}>
            {tab === 'admin' ? 'No pending observations' :
             tab === 'mine' ? 'No observations yet' : 'No community observations yet'}
          </p>
          <p style={{ fontSize: '0.78rem', color: MUTED, lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
            {tab === 'mine'
              ? 'Share your Venus sightings with the community. Each entry auto-captures current Venus data.'
              : tab === 'admin'
              ? 'All observations have been reviewed.'
              : 'Be the first to share a Venus observation!'}
          </p>
        </div>
      )}

      {/* Entries list */}
      {!loading && entries.map(entry => (
        <EntryCard
          key={entry.id}
          entry={entry}
          isMine={entry.device_id === deviceId}
          isAdmin={isAdmin}
          onDelete={handleDelete}
          onAdminDelete={isAdmin ? handleAdminDelete : null}
          onApprove={isAdmin ? handleApprove : null}
          onReject={isAdmin ? handleReject : null}
        />
      ))}
    </main>
  )
}

// ─── Shared styles ──────────────────────────────────────────────────────────

function pillStyle(active) {
  return {
    padding: '5px 11px', borderRadius: 20,
    fontSize: '0.72rem', cursor: 'pointer',
    background: active ? 'rgba(197,201,168,0.2)' : 'rgba(61,61,46,0.5)',
    border: `1px solid ${active ? 'rgba(197,201,168,0.5)' : 'rgba(255,255,255,0.1)'}`,
    color: active ? SAGE : MUTED,
    fontWeight: active ? 600 : 400,
  }
}

function linkBtnStyle(color, disabled) {
  return {
    background: 'none', border: 'none', color,
    fontSize: '0.72rem', cursor: disabled ? 'default' : 'pointer',
    padding: 0, opacity: disabled ? 0.5 : 1,
  }
}
