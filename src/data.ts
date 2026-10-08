export interface Building { id: string; name: string; type: string; floors: number; pos: [number, number]; size: number; color: string; occupancy: number; energy: number; devices: number; status: string }
export const ROADS = [-24, 0, 24]
const defs: [string, string, number, string][] = [
  ['City General Hospital', 'Healthcare', 12, '#e8eef5'], ['Central School', 'Education', 4, '#f2c14e'],
  ['Metro Mall', 'Shopping', 5, '#d96c8a'], ['Police Headquarters', 'Police Station', 6, '#4a6fa5'],
  ['Fire Station No. 1', 'Fire Station', 3, '#c8453a'], ['Central Railway Station', 'Railway Station', 3, '#8a7f72'],
  ['Nova Office Tower', 'Office', 22, '#5d8aa8'], ['Apex Office Tower', 'Office', 16, '#6c7a96'],
  ['Helix Office Tower', 'Office', 19, '#4f6d7a'], ['Orbit Office Tower', 'Office', 13, '#7b8fa1'],
  ['Riverside Residences', 'Residential', 14, '#c9b79c'], ['Skyline Apartments', 'Residential', 18, '#b8a898'],
  ['Maple Heights', 'Residential', 10, '#d4c4a8'], ['Harbor View Towers', 'Residential', 15, '#a99f93'],
  ['Solar Power Plant', 'Energy', 1, '#2c3e50'], ['Central Green Park', 'Park', 0, '#3f8f4f'],
]
const slots = [-36, -12, 12, 36]
export const BUILDINGS: Building[] = defs.map(([name, type, floors, color], i) => ({
  id: 'b' + i, name, type, floors, color, pos: [slots[i % 4], slots[Math.floor(i / 4)]], size: type === 'Park' || type === 'Energy' ? 14 : 8 + (i % 3),
  occupancy: 55 + ((i * 17) % 40), energy: 45 + ((i * 29) % 50), devices: 80 + ((i * 53) % 400), status: i === 5 ? 'Busy' : 'Operational',
}))
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const daylight = (h: number) => clamp(Math.sin(((h - 6) / 12) * Math.PI) * 1.6 + 0.3, 0, 1)
export type Light = 'green' | 'yellow' | 'red'
export function lightState(t: number): { h: Light; v: Light } {
  const c = t % 16
  return { h: c < 6 ? 'green' : c < 8 ? 'yellow' : 'red', v: c < 8 ? 'red' : c < 14 ? 'green' : 'yellow' }
}
export const trafficSeries = Array.from({ length: 12 }, (_, i) => ({ h: i * 2 + ':00', traffic: [12, 8, 25, 78, 62, 55, 58, 82, 70, 40, 28, 18][i], energy: [48, 44, 55, 72, 80, 85, 88, 90, 92, 78, 62, 52][i], co2: [410, 405, 420, 450, 440, 435, 438, 455, 448, 430, 420, 412][i], pop: 1.0 + i * 0.02 }))
