import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import ObserverInput from './components/ObserverInput.jsx'
import VenusHero from './components/VenusHero.jsx'
import CalendarToday from './components/CalendarToday.jsx'
import EventsList from './components/EventsList.jsx'
import EphemerisChart from './components/EphemerisChart.jsx'
import CalendarGrid from './components/CalendarGrid.jsx'
import BottomNav from './components/BottomNav.jsx'
const InfoPage = lazy(() => import('./pages/InfoPage.jsx'))
const NewsPage = lazy(() => import('./pages/NewsPage.jsx'))
import {
  fetchVenus,
  fetchEvents,
  fetchCalendarToday,
  fetchCalendarYear,
} from './api.js'

function useData(fetchFn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetchFn()
      setState({ data, loading: false, error: null })
    } catch (err) {
      setState({ data: null, loading: false, error: err.message })
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  return state
}

export default function App() {
  const [tab, setTab] = useState('venus')
  const [lat, setLat] = useState(0)
  const [lon, setLon] = useState(0)
  const [criticalLoaded, setCriticalLoaded] = useState(false)

  const year = new Date().getFullYear()

  const venus    = useData(() => fetchVenus(lat, lon),         [lat, lon])
  const calToday = useData(() => fetchCalendarToday(lat, lon), [lat, lon])

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

  return (
    <>
      {tab === 'venus' && (
        <main className="app-main">
          {/* Location bar */}
          <div style={{
            background: '#3D3D2E',
            borderRadius: 10,
            padding: '10px 16px',
          }}>
            <ObserverInput lat={lat} lon={lon} onUpdate={handleUpdate} />
          </div>

          <VenusHero data={venus.data} loading={venus.loading} error={venus.error} />

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

      {tab === 'info' && (
        <Suspense fallback={suspenseFallback}>
          <InfoPage />
        </Suspense>
      )}

      {tab === 'news' && (
        <Suspense fallback={suspenseFallback}>
          <NewsPage />
        </Suspense>
      )}

      <BottomNav active={tab} onChange={setTab} />
    </>
  )
}
