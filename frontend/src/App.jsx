import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import VenusHero from './components/VenusHero.jsx'
import CalendarToday from './components/CalendarToday.jsx'
import EventsList from './components/EventsList.jsx'
import EphemerisChart from './components/EphemerisChart.jsx'
import CalendarGrid from './components/CalendarGrid.jsx'
import BottomNav from './components/BottomNav.jsx'
const InfoPage    = lazy(() => import('./pages/InfoPage.jsx'))
const TonightPage = lazy(() => import('./pages/TonightPage.jsx'))
const LogPage     = lazy(() => import('./pages/LogPage.jsx'))
const SkyFinder   = lazy(() => import('./pages/SkyFinder.jsx'))
import {
  fetchVenus,
  fetchEvents,
  fetchCalendarToday,
  fetchCalendarYear,
  fetchSky,
} from './api.js'

function useData(fetchFn, deps, { intervalMs } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const intervalRef = useRef(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetchFn()
      setState({ data, loading: false, error: null })
    } catch (err) {
      setState(s => silent && s.data
        ? { ...s, loading: false }
        : { data: null, loading: false, error: err.message })
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!intervalMs) return
    const tick = () => {
      if (document.visibilityState === 'visible') load(true)
    }
    intervalRef.current = setInterval(tick, intervalMs)
    return () => clearInterval(intervalRef.current)
  }, [load, intervalMs])

  return state
}

function AcceptanceGate({ onAccept }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0D0D08',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        maxWidth: 400, width: '100%',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '1.6rem', fontFamily: 'Georgia, serif', fontWeight: 'normal',
          color: 'var(--dark)', letterSpacing: '0.06em', marginBottom: 8,
        }}>
          Venus Tracker
        </h1>
        <p style={{
          fontSize: '0.85rem', color: 'var(--dark-muted)',
          fontStyle: 'italic', fontFamily: 'Georgia, serif',
          marginBottom: 32,
        }}>
          Astronomy & astrology companion for Venus
        </p>

        <div style={{
          background: 'var(--sand)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '16px 18px',
          textAlign: 'left', marginBottom: 28,
          maxHeight: 300, overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          <h2 style={{
            fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--dark-muted)', marginBottom: 12, marginTop: 0,
          }}>
            Privacy Policy
          </h2>
          <p style={gateParaStyle}>
            Your location is used on-device only to calculate Venus and Moon positions. It is never transmitted to third parties or stored on our servers.
          </p>
          <p style={gateParaStyle}>
            The camera is used only for the Sky Finder viewfinder. No images are captured or stored. News is fetched anonymously from Google News RSS. No analytics, cookies, tracking, or advertising.
          </p>
          <p style={gateParaStyle}>
            Third-party services: Nominatim (reverse geocoding) and JPL Horizons (astronomical data) — all requests are anonymous.
          </p>

          <h2 style={{
            fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--dark-muted)', marginBottom: 12, marginTop: 20,
          }}>
            Terms of Service
          </h2>
          <p style={gateParaStyle}>
            Venus Tracker is provided "as is" without warranty. All astronomical and astrological data is for informational and educational purposes only.
          </p>
          <p style={{ ...gateParaStyle, marginBottom: 0 }}>
            We are not responsible for the accuracy of third-party data. By using this app you assume all risk. Terms may be updated; continued use constitutes acceptance.
          </p>
        </div>

        <button
          onClick={onAccept}
          style={{
            background: '#C5C9A8', color: '#1a1a14',
            border: 'none', borderRadius: 24,
            padding: '14px 36px',
            fontSize: '0.88rem', fontWeight: 600,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Accept & Continue
        </button>

        <p style={{
          fontSize: '0.68rem', color: 'var(--dark-muted)',
          marginTop: 14, lineHeight: 1.6,
        }}>
          By tapping "Accept & Continue" you agree to the Privacy Policy and Terms of Service.
        </p>
      </div>
    </div>
  )
}

const gateParaStyle = {
  fontSize: '0.78rem', color: 'var(--dark)', lineHeight: 1.7,
  marginTop: 0, marginBottom: 10,
}

export default function App() {
  const [tab, setTab] = useState('venus')
  const [lat, setLat] = useState(0)
  const [lon, setLon] = useState(0)
  const [criticalLoaded, setCriticalLoaded] = useState(false)
  const [accepted, setAccepted] = useState(() => localStorage.getItem('tos_accepted') === '1')

  const year = new Date().getFullYear()

  const venus    = useData(() => fetchVenus(lat, lon),         [lat, lon], { intervalMs: 30000 })
  const calToday = useData(() => fetchCalendarToday(lat, lon), [lat, lon])
  const sky      = useData(() => fetchSky(lat, lon),           [lat, lon], { intervalMs: 30000 })

  useEffect(() => {
    if (!venus.loading && !calToday.loading) {
      setCriticalLoaded(true)
    }
  }, [venus.loading, calToday.loading])

  const calYear = useData(
    () => criticalLoaded ? fetchCalendarYear(lat, lon, year) : Promise.resolve(null),
    [lat, lon, year, criticalLoaded],
  )
  const events = useData(
    () => criticalLoaded ? fetchEvents(lat, lon, 365) : Promise.resolve(null),
    [lat, lon, criticalLoaded],
  )

  function handleUpdate(newLat, newLon) {
    setLat(newLat)
    setLon(newLon)
  }

  const suspenseFallback = <p style={{ padding: 40, textAlign: 'center' }}>Loading…</p>

  if (!accepted) {
    return <AcceptanceGate onAccept={() => {
      localStorage.setItem('tos_accepted', '1')
      setAccepted(true)
    }} />
  }

  return (
    <>
      {tab === 'venus' && (
        <main className="app-main">
          <VenusHero
            data={venus.data} loading={venus.loading} error={venus.error}
            lat={lat} lon={lon} onUpdateLocation={handleUpdate}
          />

          <CalendarToday
            data={calToday.data}
            loading={calToday.loading}
            error={calToday.error}
            calYear={calYear.data}
          />

          <EphemerisChart data={venus.data} loading={venus.loading} error={venus.error} />

          <CalendarGrid data={calYear.data} loading={calYear.loading} error={calYear.error} />

          <EventsList data={events.data} loading={events.loading} error={events.error} />
        </main>
      )}

      {tab === 'sky' && (
        <Suspense fallback={suspenseFallback}>
          <SkyFinder
            data={venus.data} loading={venus.loading} error={venus.error}
            moonData={sky.data?.moon}
            sunData={sky.data?.sun}
            lat={lat} lon={lon}
          />
        </Suspense>
      )}

      {tab === 'info' && (
        <Suspense fallback={suspenseFallback}>
          <InfoPage />
        </Suspense>
      )}

      {tab === 'tonight' && (
        <Suspense fallback={suspenseFallback}>
          <TonightPage
            venusData={venus.data}
            moonData={sky.data?.moon}
            sunData={sky.data?.sun}
          />
        </Suspense>
      )}

      {tab === 'log' && (
        <Suspense fallback={suspenseFallback}>
          <LogPage venusData={venus.data} />
        </Suspense>
      )}

      <BottomNav active={tab} onChange={setTab} />
    </>
  )
}
