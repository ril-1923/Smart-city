import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useCity } from '../store'
import { trafficSeries } from '../data'

const Box = ({ title, children }: { title: string; children: React.ReactElement }) => (
  <div className="glass p-3 h-100"><h6 className="text-info">{title}</h6><div style={{ height: 220 }}><ResponsiveContainer>{children}</ResponsiveContainer></div></div>
)
const axes = <><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="h" stroke="#94a3b8" fontSize={11} /><YAxis stroke="#94a3b8" fontSize={11} /><Tooltip /></>

export function DashboardPage() {
  const s = useCity((x) => x.stats)
  const cards: [string, string, string][] = [['Population', (s.population / 1e6).toFixed(2) + 'M', '▲ 1.2%'], ['Active Vehicles', String(s.vehicles * 36), '▲ 3%'], ['Energy Usage', s.energy + '%', '▼ 2%'], ['Air Quality', s.aqi < 50 ? 'Good' : 'Fair', '▲'], ['Public Transport', s.transit + '%', '▲ 1%'], ['Green Energy', s.green + '%', '▲ 4%']]
  return (
    <div className="p-2 container-fluid">
      <div className="row g-2 mb-2">{cards.map(([k, v, t]) => <div key={k} className="col-6 col-md-4 col-xl-2"><div className="glass stat"><div className="small opacity-75">{k}</div><div className="v">{v}</div><small className="text-success">{t}</small></div></div>)}</div>
      <div className="row g-2">
        <div className="col-lg-6"><Box title="Traffic through the day"><LineChart data={trafficSeries}>{axes}<Line dataKey="traffic" stroke="#22d3ee" dot={false} /></LineChart></Box></div>
        <div className="col-lg-6"><Box title="Energy consumption"><AreaChart data={trafficSeries}>{axes}<Area dataKey="energy" stroke="#38bdf8" fill="#0ea5e9" fillOpacity={0.3} /></AreaChart></Box></div>
        <div className="col-lg-6"><Box title="Population (M)"><BarChart data={trafficSeries}>{axes}<Bar dataKey="pop" fill="#22d3ee" /></BarChart></Box></div>
        <div className="col-lg-6"><Box title="CO₂ (ppm)"><LineChart data={trafficSeries}>{axes}<Line dataKey="co2" stroke="#4ade80" dot={false} /></LineChart></Box></div>
      </div>
    </div>
  )
}
export function ChartPage({ kind }: { kind: 'traffic' | 'energy' | 'co2' }) {
  const s = useCity((x) => x.stats)
  return (
    <div className="p-2 container-fluid">
      <div className="glass p-3 mb-2">{kind === 'traffic' && 'Vehicles: ' + s.vehicles + ' · Congestion: Moderate · Signals: 9 · Accidents: 0'}{kind === 'energy' && 'Consumption ' + s.energy + '% · Renewable ' + s.green + '% · Solar 4.8 MW · EV charging 42 active'}{kind === 'co2' && 'AQI ' + s.aqi + ' · CO₂ 430 ppm · Green coverage 38%'}</div>
      <Box title={kind.toUpperCase()}><AreaChart data={trafficSeries}>{axes}<Area dataKey={kind} stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} /></AreaChart></Box>
    </div>
  )
}
export function SettingsPage() {
  const { theme, traffic, set } = useCity()
  return (
    <div className="p-3"><div className="glass p-3" style={{ maxWidth: 420 }}>
      <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={theme === 'dark'} onChange={() => set({ theme: theme === 'dark' ? 'light' : 'dark' })} /><label className="form-check-label">Dark theme</label></div>
      <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={traffic} onChange={() => set({ traffic: !traffic })} /><label className="form-check-label">Traffic</label></div>
    </div></div>
  )
}
