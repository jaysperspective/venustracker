const BASE = import.meta.env.VITE_API_URL ?? ''

function qs(lat, lon, extra = {}) {
  const params = new URLSearchParams({ lat, lon, ...extra })
  return params.toString()
}

export async function fetchVenus(lat, lon) {
  const res = await fetch(`${BASE}/api/venus?${qs(lat, lon)}`)
  if (!res.ok) throw new Error(`Venus fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchEphemeris(lat, lon, days = 30) {
  const res = await fetch(`${BASE}/api/venus/ephemeris?${qs(lat, lon, { days })}`)
  if (!res.ok) throw new Error(`Ephemeris fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchEvents(lat, lon, days = 365) {
  const res = await fetch(`${BASE}/api/venus/events?${qs(lat, lon, { days })}`)
  if (!res.ok) throw new Error(`Events fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchCalendarToday(lat, lon) {
  const res = await fetch(`${BASE}/api/calendar/today?${qs(lat, lon)}`)
  if (!res.ok) throw new Error(`Calendar today fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchCalendarYear(lat, lon, year) {
  const res = await fetch(`${BASE}/api/calendar/year?${qs(lat, lon, { year })}`)
  if (!res.ok) throw new Error(`Calendar year fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchSky(lat, lon) {
  const res = await fetch(`${BASE}/api/sky?${qs(lat, lon)}`)
  if (!res.ok) throw new Error(`Sky fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchNews(category = 'all') {
  const res = await fetch(`${BASE}/api/news?${new URLSearchParams({ category })}`)
  if (!res.ok) throw new Error(`News fetch failed: ${res.status}`)
  return res.json()
}
