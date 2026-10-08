import { lazy, Suspense } from 'react'
import { useCity } from '../store'
import { BUILDINGS } from '../data'
const CityScene = lazy(() => import('../components/CityScene'))

function hasWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false } }

function Controls() {
  const { auto, hour, traffic, cam, set, camTick } = useCity()
  const mode = (m: 'orbit' | 'top' | 'street') => set({ cam: m, camTick: camTick + 1 })
  return (
    <div className="overlay glass p-2 small" style={{ top: 8, left: 8, width: 230 }}>
      <div className="btn-group btn-group-sm w-100 mb-2">
        {(['orbit', 'top', 'street'] as const).map((m) => <button key={m} className={'btn btn-outline-info' + (cam === m ? ' active' : '')} onClick={() => mode(m)}>{m}</button>)}
        <button className="btn btn-outline-info" title="Reset" onClick={() => mode('orbit')}><i className="bi bi-arrow-counterclockwise" /></button>
      </div>
      DAY <input type="range" className="form-range" min={0} max={24} step={0.1} value={hour} onChange={(e) => set({ hour: +e.target.value, auto: false })} /> NIGHT
      <div className="d-flex gap-1 mt-1">
        <button className={'btn btn-sm btn-outline-info flex-fill' + (auto ? ' active' : '')} onClick={() => set({ auto: !auto })}>Auto cycle</button>
        <button className="btn btn-sm btn-outline-info" onClick={() => set({ hour: 12, auto: false })}>Day</button>
        <button className="btn btn-sm btn-outline-info" onClick={() => set({ hour: 23, auto: false })}>Night</button>
      </div>
      <div className="form-check form-switch mt-2"><input className="form-check-input" type="checkbox" checked={traffic} onChange={() => set({ traffic: !traffic })} /><label className="form-check-label">Traffic ON/OFF</label></div>
    </div>
  )
}

function BuildingPanel() {
  const id = useCity((s) => s.selected)
  const set = useCity((s) => s.set)
  const b = BUILDINGS.find((x) => x.id === id)
  if (!b) return null
  const rows: [string, string][] = [['Type', b.type], ['Floors', String(b.floors)], ['Occupancy', b.occupancy + '%'], ['Energy Usage', b.energy + '%'], ['Connected Devices', String(b.devices)], ['Status', b.status]]
  return (
    <div className="overlay glass p-3" style={{ top: 8, right: 8, width: 250, maxWidth: 'calc(100% - 16px)' }}>
      <div className="d-flex justify-content-between"><b className="text-info text-uppercase">{b.name}</b><button className="btn-close btn-close-white btn-sm" onClick={() => set({ selected: null })} /></div>
      {rows.map(([k, v]) => <div key={k} className="d-flex justify-content-between small border-bottom border-secondary py-1"><span className="opacity-75">{k}</span><span>{v}</span></div>)}
    </div>
  )
}

export default function CityPage() {
  if (!hasWebGL()) return <div className="p-4 text-center"><h5>3D graphics are not supported by this browser.</h5><p>Please enable WebGL or use a modern browser.</p></div>
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Suspense fallback={<div className="p-4">Loading 3D scene…</div>}><CityScene /></Suspense>
      <Controls /><BuildingPanel />
    </div>
  )
}
