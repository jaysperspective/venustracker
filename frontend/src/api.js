const BASE = import.meta.env.VITE_API_URL ?? ''

function qs(lat, lon, extra = {}) {
  const params = new URLSearchParams({ lat, lon, ...extra })
  return params.toString()
}

// ─── Offline cache wrapper ──────────────────────────────────────────────────

async function cachedFetch(key, fetchFn) {
  try {
    const data = await fetchFn()
    try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* quota */ }
    return data
  } catch (err) {
    const cached = localStorage.getItem(key)
    if (cached) return JSON.parse(cached)
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
