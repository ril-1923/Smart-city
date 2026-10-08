import { create } from 'zustand'
export type Weather = 'sunny' | 'cloudy' | 'rain'
export type CamMode = 'orbit' | 'top' | 'street'
export interface Stats { population: number; vehicles: number; energy: number; aqi: number; green: number; transit: number }
interface State {
  selected: string | null; hover: string | null; weather: Weather; hour: number; auto: boolean
  traffic: boolean; theme: 'dark' | 'light'; cam: CamMode; camTick: number; focusTick: number
  query: string; stats: Stats; set: (p: Partial<State>) => void
}
export const useCity = create<State>((s) => ({
  selected: null, hover: null, weather: 'sunny', hour: 12, auto: false, traffic: true,
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark', cam: 'orbit', camTick: 0, focusTick: 0, query: '',
  stats: { population: 1200000, vehicles: 36, energy: 82, aqi: 42, green: 64, transit: 92 },
  set: (p) => s(p),
}))
