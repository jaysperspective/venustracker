const BASE = import.meta.env.VITE_API_URL ?? ''

function qs(lat, lon, extra = {}) {
  const params = new URLSearchParams({ lat, lon, ...extra })
  return params.toString()
}

function safeParse(raw) {
  try { return JSON.parse(raw) } catch { return null }
}

// ─── Offline cache wrapper ──────────────────────────────────────────────────

async function cachedFetch(key, fetchFn) {
  try {
    const data = await fetchFn()
    try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* quota */ }
    return data
  } catch (err) {
    const cached = localStorage.getItem(key)
    if (cached) {
      const parsed = safeParse(cached)
      if (parsed !== null) return parsed
    }
    throw err
  }
}

// ─── API functions ──────────────────────────────────────────────────────────

export async function fetchVenus(lat, lon) {
  return cachedFetch(`cache:venus:${lat}:${lon}`, async () => {
    const res = await fetch(`${BASE}/api/venus?${qs(lat, lon)}`)
    if (!res.ok) throw new Error(`Venus fetch failed: ${res.status}`)
    return res.json()
  })
}

export async function fetchEphemeris(lat, lon, days = 30) {
  return cachedFetch(`cache:ephemeris:${lat}:${lon}:${days}`, async () => {
    const res = await fetch(`${BASE}/api/venus/ephemeris?${qs(lat, lon, { days })}`)
    if (!res.ok) throw new Error(`Ephemeris fetch failed: ${res.status}`)
    return res.json()
  })
}

export async function fetchEvents(lat, lon, days = 365) {
  return cachedFetch(`cache:events:${lat}:${lon}:${days}`, async () => {
    const res = await fetch(`${BASE}/api/venus/events?${qs(lat, lon, { days })}`)
    if (!res.ok) throw new Error(`Events fetch failed: ${res.status}`)
    return res.json()
  })
}

export async function fetchCalendarToday(lat, lon) {
  return cachedFetch(`cache:caltoday:${lat}:${lon}`, async () => {
    const res = await fetch(`${BASE}/api/calendar/today?${qs(lat, lon)}`)
    if (!res.ok) throw new Error(`Calendar today fetch failed: ${res.status}`)
    return res.json()
  })
}

export async function fetchCalendarYear(lat, lon, year) {
  return cachedFetch(`cache:calyear:${lat}:${lon}:${year}`, async () => {
    const res = await fetch(`${BASE}/api/calendar/year?${qs(lat, lon, { year })}`)
    if (!res.ok) throw new Error(`Calendar year fetch failed: ${res.status}`)
    return res.json()
  })
}

export async function fetchSky(lat, lon) {
  return cachedFetch(`cache:sky:${lat}:${lon}`, async () => {
    const res = await fetch(`${BASE}/api/sky?${qs(lat, lon)}`)
    if (!res.ok) throw new Error(`Sky fetch failed: ${res.status}`)
    return res.json()
  })
}

export async function fetchNews(category = 'all') {
  return cachedFetch(`cache:news:${category}`, async () => {
    const res = await fetch(`${BASE}/api/news?${new URLSearchParams({ category })}`)
    if (!res.ok) throw new Error(`News fetch failed: ${res.status}`)
    return res.json()
  })
}

// ─── Device identity ────────────────────────────────────────────────────────

function getDeviceId() {
  let id = localStorage.getItem('vt_device_id')
  if (!id) {
    id = crypto.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2))
    localStorage.setItem('vt_device_id', id)
  }
  return id
}

export function getDisplayName() {
  return localStorage.getItem('vt_display_name') || ''
}

export function setDisplayName(name) {
  localStorage.setItem('vt_display_name', name)
}

// ─── Community log ──────────────────────────────────────────────────────────

export async function fetchLog({ limit = 50, offset = 0, mine = false } = {}) {
  const params = new URLSearchParams({ limit, offset })
  if (mine) params.set('mine', 'true')
  const res = await fetch(`${BASE}/api/log?${params}`, {
    headers: { 'X-Device-Id': getDeviceId() },
  })
  if (!res.ok) throw new Error(`Log fetch failed: ${res.status}`)
  return res.json()
}

export async function postLog(observation) {
  const res = await fetch(`${BASE}/api/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': getDeviceId(),
    },
    body: JSON.stringify(observation),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Post failed: ${res.status}`)
  }
  return res.json()
}

export async function deleteLog(obsId) {
  const res = await fetch(`${BASE}/api/log/${obsId}`, {
    method: 'DELETE',
    headers: { 'X-Device-Id': getDeviceId() },
  })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
  return res.json()
}

export function logImageUrl(filename) {
  return `${BASE}/api/log/images/${filename}`
}

// ─── Admin moderation ───────────────────────────────────────────────────────

export function getAdminSecret() {
  return localStorage.getItem('vt_admin_secret') || ''
}

export function setAdminSecret(secret) {
  localStorage.setItem('vt_admin_secret', secret)
}

export async function fetchPending({ limit = 50, offset = 0 } = {}) {
  const secret = getAdminSecret()
  const params = new URLSearchParams({ limit, offset })
  const res = await fetch(`${BASE}/api/admin/log/pending?${params}`, {
    headers: { 'X-Admin-Secret': secret },
  })
  if (!res.ok) throw new Error(`Pending fetch failed: ${res.status}`)
  return res.json()
}

export async function approveLog(obsId) {
  const res = await fetch(`${BASE}/api/admin/log/${obsId}/approve`, {
    method: 'POST',
    headers: { 'X-Admin-Secret': getAdminSecret() },
  })
  if (!res.ok) throw new Error(`Approve failed: ${res.status}`)
  return res.json()
}

export async function rejectLog(obsId) {
  const res = await fetch(`${BASE}/api/admin/log/${obsId}/reject`, {
    method: 'POST',
    headers: { 'X-Admin-Secret': getAdminSecret() },
  })
  if (!res.ok) throw new Error(`Reject failed: ${res.status}`)
  return res.json()
}

export async function adminDeleteLog(obsId) {
  const res = await fetch(`${BASE}/api/admin/log/${obsId}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Secret': getAdminSecret() },
  })
  if (!res.ok) throw new Error(`Admin delete failed: ${res.status}`)
  return res.json()
}
