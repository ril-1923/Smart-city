import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { useCity } from './store'
import { BUILDINGS } from './data'
import CityPage from './pages/CityPage'
import { DashboardPage, ChartPage, SettingsPage } from './pages/Pages'

const NAV: [string, string, string][] = [['/', 'Dashboard', 'speedometer2'], ['/city', '3D City', 'buildings'], ['/traffic', 'Traffic', 'car-front'], ['/energy', 'Energy', 'lightning-charge'], ['/environment', 'Environment', 'tree'], ['/settings', 'Settings', 'gear']]

function Header({ onMenu }: { onMenu: () => void }) {
  const { query, theme, weather, set } = useCity()
  const nav = useNavigate()
  const q = query.trim().toLowerCase()
  const res = q ? BUILDINGS.filter((b) => (b.name + b.type).toLowerCase().includes(q)).slice(0, 6) : []
  return (
    <div className="glass m-2 p-2 d-flex align-items-center gap-2 position-relative" style={{ zIndex: 20 }}>
      <button className="btn btn-sm btn-outline-info d-lg-none" onClick={onMenu}><i className="bi bi-list" /></button>
      <strong className="text-info">SMART CITY</strong>
      <div className="position-relative flex-grow-1" style={{ maxWidth: 360 }}>
        <input className="form-control form-control-sm" placeholder="Search hospital, school, mall…" value={query} onChange={(e) => set({ query: e.target.value })} />
        {res.length > 0 && (
          <div className="glass position-absolute w-100 mt-1 p-1" style={{ background: '#0f172a' }}>
            {res.map((b) => (
              <button key={b.id} className="btn btn-sm text-start w-100 text-info" onClick={() => { set({ selected: b.id, query: '', focusTick: useCity.getState().focusTick + 1 }); nav('/city') }}>{b.name}</button>
            ))}
          </div>
        )}
      </div>
      <div className="btn-group btn-group-sm ms-auto">
        {([['sunny', 'sun'], ['cloudy', 'cloud'], ['rain', 'cloud-rain']] as const).map(([w, i]) => (
          <button key={w} className={'btn btn-outline-info' + (weather === w ? ' active' : '')} title={w} onClick={() => set({ weather: w })}><i className={'bi bi-' + i} /></button>
        ))}
      </div>
      <button className="btn btn-sm btn-outline-info" onClick={() => set({ theme: theme === 'dark' ? 'light' : 'dark' })}><i className={'bi bi-' + (theme === 'dark' ? 'moon' : 'sun')} /></button>
    </div>
  )
}

function StatsBar() {
  const s = useCity((x) => x.stats)
  const items: [string, string][] = [['Population', (s.population / 1e6).toFixed(2) + 'M'], ['Traffic', 'Moderate'], ['Energy', s.energy + '%'], ['Air Quality', s.aqi < 50 ? 'Good (' + s.aqi + ')' : 'Fair'], ['Active Vehicles', String(s.vehicles)]]
  return <div className="statsbar">{items.map(([k, v]) => <div key={k} className="glass"><div className="opacity-75">{k}</div><b className="text-info">{v}</b></div>)}</div>
}

export default function App() {
  const [open, setOpen] = useState(false)
  const [pct, setPct] = useState(0)
  const theme = useCity((s) => s.theme)
  useEffect(() => { document.documentElement.dataset.bsTheme = theme; localStorage.setItem('theme', theme) }, [theme])
  useEffect(() => {
    const t = setInterval(() => setPct((p) => Math.min(100, p + 8)), 120)
    const u = setInterval(() => {
      const { stats, set } = useCity.getState()
      const j = (v: number, d: number, a: number, b: number) => Math.min(b, Math.max(a, Math.round(v + (Math.random() - 0.5) * d)))
      set({ stats: { ...stats, energy: j(stats.energy, 4, 60, 98), aqi: j(stats.aqi, 6, 20, 80), green: j(stats.green, 3, 40, 85), population: stats.population + Math.round(Math.random() * 20) } })
    }, 2000)
    return () => { clearInterval(t); clearInterval(u) }
  }, [])
  const msgs = ['Initializing urban systems…', 'Loading buildings…', 'Connecting traffic network…', 'Initializing smart infrastructure…']
  return (
    <>
      {pct < 100 && <div className="loading"><h2>SMART CITY</h2><div>{msgs[Math.min(3, Math.floor(pct / 26))]}</div><div>{pct}%</div></div>}
      <div className="app">
        <aside className={'sidebar glass m-2 ' + (open ? 'open' : '')} onClick={() => setOpen(false)}>
          <div className="nav flex-column gap-1">
            {NAV.map(([to, label, icon]) => <NavLink key={to} to={to} end className="nav-link"><i className={'bi bi-' + icon + ' me-2'} />{label}</NavLink>)}
          </div>
        </aside>
        <div className="main">
          <Header onMenu={() => setOpen(!open)} />
          <div className="view">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/city" element={<CityPage />} />
              <Route path="/traffic" element={<ChartPage kind="traffic" />} />
              <Route path="/energy" element={<ChartPage kind="energy" />} />
              <Route path="/environment" element={<ChartPage kind="co2" />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
          <StatsBar />
        </div>
      </div>
    </>
  )
}
