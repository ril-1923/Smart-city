import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Edges, Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useCity } from '../store'
import { BUILDINGS, Building, ROADS, daylight, lightState } from '../data'

const box = new THREE.BoxGeometry(1, 1, 1)
const cache: { wall?: THREE.CanvasTexture; lit?: THREE.CanvasTexture } = {}
function makeTex(lit: boolean) {
  const c = document.createElement('canvas'); c.width = c.height = 32
  const g = c.getContext('2d')!
  g.fillStyle = lit ? '#000' : '#fff'; g.fillRect(0, 0, 32, 32)
  g.fillStyle = lit ? '#ffe3a0' : '#5b6b82'; g.fillRect(6, 6, 20, 14)
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

function BuildingMesh({ b }: { b: Building }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  const sel = useCity((s) => s.selected === b.id)
  const hov = useCity((s) => s.hover === b.id)
  const set = useCity((s) => s.set)
  const park = b.type === 'Park', solar = b.type === 'Energy'
  const h = park ? 0.3 : solar ? 0.6 : b.floors * 2.6
  const [wall, lit] = useMemo(() => {
    const mk = (base: THREE.CanvasTexture) => { const t = base.clone(); t.repeat.set(b.size / 3, Math.max(1, b.floors / 1.5)); t.needsUpdate = true; return t }
    return [mk((cache.wall ??= makeTex(false))), mk((cache.lit ??= makeTex(true)))]
  }, [b])
  useFrame(() => {
    if (mat.current) mat.current.emissiveIntensity = (1 - daylight(useCity.getState().hour)) * 1.1 + (hov ? 0.25 : 0)
  })
  const plain = park || solar
  return (
    <group position={[b.pos[0], 0, b.pos[1]]}
      onPointerOver={(e) => { e.stopPropagation(); set({ hover: b.id }); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { set({ hover: null }); document.body.style.cursor = 'auto' }}
      onClick={(e) => { e.stopPropagation(); set({ selected: b.id }) }}>
      <mesh geometry={box} position={[0, h / 2, 0]} scale={[b.size, h, b.size]} castShadow receiveShadow>
        <meshStandardMaterial ref={mat} color={b.color} map={plain ? null : wall} emissive="#ffd98a" emissiveMap={plain ? null : lit} emissiveIntensity={0} />
        {sel && <Edges color="#22d3ee" threshold={15} />}
      </mesh>
      {!plain && <>
        <mesh geometry={box} position={[0, h + 0.6, 0]} scale={[b.size * 0.4, 1.2, b.size * 0.4]}><meshStandardMaterial color="#64748b" /></mesh>
        <mesh geometry={box} position={[0, 0.8, b.size / 2 + 0.05]} scale={[1.6, 1.6, 0.2]}><meshStandardMaterial color="#1e293b" /></mesh>
      </>}
      {park && [[-4, -3], [3, 4], [-2, 5], [5, -4], [0, 0]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}><mesh position={[0, 1, 0]}><cylinderGeometry args={[0.2, 0.2, 2, 5]} /><meshStandardMaterial color="#6b4423" /></mesh><mesh position={[0, 3, 0]}><coneGeometry args={[1.4, 3, 6]} /><meshStandardMaterial color="#2f7d3e" /></mesh></group>
      ))}
      {solar && [-4, 0, 4].flatMap((x) => [-4, 0, 4].map((z) => <mesh key={x + ',' + z} geometry={box} position={[x, 1.2, z]} rotation={[-0.5, 0, 0]} scale={[3, 0.1, 2.4]}><meshStandardMaterial color="#1d4ed8" metalness={0.6} roughness={0.3} /></mesh>))}
      {hov && <Html position={[0, h + 2, 0]} center className="tag">{b.name}</Html>}
    </group>
  )
}

function Roads() {
  const asphalt = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(() => {
    const rain = useCity.getState().weather === 'rain'
    if (asphalt.current) { asphalt.current.roughness = rain ? 0.2 : 0.9; asphalt.current.metalness = rain ? 0.5 : 0 }
  })
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#3d6b4a" /></mesh>
      {ROADS.map((r) => (
        <group key={r}>
          <mesh geometry={box} position={[0, 0.05, r]} scale={[130, 0.1, 8]} receiveShadow><meshStandardMaterial ref={r === 0 ? asphalt : undefined} color="#2b2f3a" /></mesh>
          <mesh geometry={box} position={[r, 0.06, 0]} scale={[8, 0.1, 130]} receiveShadow><meshStandardMaterial color="#2b2f3a" /></mesh>
          <mesh geometry={box} position={[0, 0.12, r]} scale={[130, 0.02, 0.2]}><meshStandardMaterial color="#e5c44c" /></mesh>
          <mesh geometry={box} position={[r, 0.13, 0]} scale={[0.2, 0.02, 130]}><meshStandardMaterial color="#e5c44c" /></mesh>
          {[-1, 1].map((sd) => <group key={sd}>
            <mesh geometry={box} position={[0, 0.1, r + sd * 4.4]} scale={[130, 0.2, 0.8]}><meshStandardMaterial color="#8d939c" /></mesh>
            <mesh geometry={box} position={[r + sd * 4.4, 0.11, 0]} scale={[0.8, 0.2, 130]}><meshStandardMaterial color="#8d939c" /></mesh>
          </group>)}
        </group>
      ))}
    </group>
  )
}

interface Car { axis: 'x' | 'z'; lane: number; dir: 1 | -1; p: number; v: number; s: number; color: string; bus: boolean; emerg: boolean }
const PAL = ['#e11d48', '#2563eb', '#16a34a', '#f97316', '#e2e8f0', '#7c3aed']
function Cars() {
  const refs = useRef<(THREE.Group | null)[]>([])
  const emergMat = useRef<THREE.MeshStandardMaterial>(null)
  const cars = useMemo(() => {
    const out: Car[] = []; let n = 0
    for (const axis of ['x', 'z'] as const) for (const r of ROADS) for (const dir of [1, -1] as const) for (let i = 0; i < 3; i++, n++)
      out.push({ axis, lane: r + dir * 1.6 * (axis === 'x' ? 1 : -1), dir, p: -55 + i * 38 + (n % 5) * 3, v: 9 + (r === 0 ? 2 : 0), s: 9, color: PAL[n % PAL.length], bus: n % 7 === 0, emerg: n === 3 })
    return out
  }, [])
  useEffect(() => { const st = useCity.getState(); st.set({ stats: { ...st.stats, vehicles: cars.length } }) }, [cars])
  useFrame((st, dt) => {
    const on = useCity.getState().traffic
    const L = lightState(st.clock.elapsedTime)
    if (emergMat.current) emergMat.current.emissive.set(Math.floor(st.clock.elapsedTime * 4) % 2 ? '#ff0000' : '#0044ff')
    cars.forEach((c, i) => {
      const g = refs.current[i]; if (!g) return
      g.visible = on; if (!on) return
      let go = true
      const sp = c.p * c.dir
      for (const r of ROADS) {
        const cc = r * c.dir
        if (sp < cc - 3.5 && sp > cc - 5.5 && (c.axis === 'x' ? L.h : L.v) === 'red' && !c.emerg) go = false
      }
      if (go) for (const o of cars) if (o !== c && o.axis === c.axis && o.lane === c.lane) { const gap = (o.p - c.p) * c.dir; if (gap > 0 && gap < 5) go = false }
      c.s += ((go ? c.v : 0) - c.s) * Math.min(1, dt * 4)
      c.p += c.s * c.dir * dt
      if (c.p > 62) c.p = -62; else if (c.p < -62) c.p = 62
      if (c.axis === 'x') { g.position.set(c.p, 0.5, c.lane); g.rotation.y = c.dir === 1 ? 0 : Math.PI }
      else { g.position.set(c.lane, 0.5, c.p); g.rotation.y = c.dir === 1 ? -Math.PI / 2 : Math.PI / 2 }
    })
  })
  return <>{cars.map((c, i) => (
    <group key={i} ref={(el) => { refs.current[i] = el }} scale={c.bus ? [1.8, 1.3, 1.2] : [1, 1, 1]}>
      <mesh geometry={box} scale={[3, 0.8, 1.5]} castShadow><meshStandardMaterial color={c.bus ? '#facc15' : c.emerg ? '#ffffff' : c.color} ref={c.emerg ? emergMat : undefined} emissiveIntensity={c.emerg ? 1 : 0} /></mesh>
      <mesh geometry={box} position={[-0.2, 0.65, 0]} scale={[1.6, 0.6, 1.3]}><meshStandardMaterial color="#1e293b" /></mesh>
    </group>
  ))}</>
}

function TrafficLights() {
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const pts = useMemo(() => ROADS.flatMap((x) => ROADS.map((z) => [x, z] as const)), [])
  const col = { green: '#22c55e', yellow: '#facc15', red: '#ef4444' }
  useFrame((st) => {
    const L = lightState(st.clock.elapsedTime)
    pts.forEach((_, i) => { const a = mats.current[2 * i], b = mats.current[2 * i + 1]; a?.color.set(col[L.h]); a?.emissive.set(col[L.h]); b?.color.set(col[L.v]); b?.emissive.set(col[L.v]) })
  })
  return <>{pts.map(([x, z], i) => (
    <group key={i} position={[x + 5.2, 0, z + 5.2]}>
      <mesh position={[0, 2, 0]}><cylinderGeometry args={[0.12, 0.12, 4, 6]} /><meshStandardMaterial color="#334155" /></mesh>
      {[0, 1].map((k) => <mesh key={k} position={[0, 3.8 - k * 0.7, 0]}><sphereGeometry args={[0.3, 8, 8]} /><meshStandardMaterial ref={(m) => { mats.current[2 * i + k] = m }} emissiveIntensity={1.5} /></mesh>)}
    </group>
  ))}</>
}

function StreetLights() {
  const poles = useRef<THREE.InstancedMesh>(null), lamps = useRef<THREE.InstancedMesh>(null), lm = useRef<THREE.MeshStandardMaterial>(null)
  const pos = useMemo(() => {
    const a: [number, number][] = []
    for (const r of ROADS) for (let t = -56; t <= 56; t += 14) {
      if (ROADS.some((q) => Math.abs(t - q) < 7)) continue
      a.push([t, r + 5.2], [r - 5.2, t])
    }
    return a
  }, [])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    pos.forEach(([x, z], i) => { poles.current?.setMatrixAt(i, m.makeTranslation(x, 2, z)); lamps.current?.setMatrixAt(i, m.makeTranslation(x, 4.1, z)) })
    if (poles.current) poles.current.instanceMatrix.needsUpdate = true
    if (lamps.current) lamps.current.instanceMatrix.needsUpdate = true
  }, [pos])
  useFrame(() => { if (lm.current) lm.current.emissiveIntensity = (1 - daylight(useCity.getState().hour)) * 3 })
  return <>
    <instancedMesh ref={poles} args={[undefined, undefined, pos.length]}><cylinderGeometry args={[0.1, 0.1, 4, 5]} /><meshStandardMaterial color="#475569" /></instancedMesh>
    <instancedMesh ref={lamps} args={[undefined, undefined, pos.length]}><sphereGeometry args={[0.35, 8, 8]} /><meshStandardMaterial ref={lm} color="#fff7d6" emissive="#ffd98a" emissiveIntensity={0} /></instancedMesh>
  </>
}

function Rain() {
  const ref = useRef<THREE.Points>(null)
  const arr = useMemo(() => { const a = new Float32Array(1500 * 3); for (let i = 0; i < a.length; i += 3) { a[i] = (Math.random() - 0.5) * 140; a[i + 1] = Math.random() * 60; a[i + 2] = (Math.random() - 0.5) * 140 } return a }, [])
  useFrame((_, dt) => {
    const p = ref.current; if (!p) return
    const on = useCity.getState().weather === 'rain'; p.visible = on; if (!on) return
    for (let i = 1; i < arr.length; i += 3) { arr[i] -= 45 * dt; if (arr[i] < 0) arr[i] = 60 }
    p.geometry.attributes.position.needsUpdate = true
  })
  return <points ref={ref} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[arr, 3]} /></bufferGeometry><pointsMaterial color="#9ec5ff" size={0.25} transparent opacity={0.7} /></points>
}

function Env() {
  const scene = useThree((s) => s.scene)
  const sunL = useRef<THREE.DirectionalLight>(null), amb = useRef<THREE.AmbientLight>(null)
  const sunM = useRef<THREE.Mesh>(null), moonM = useRef<THREE.Mesh>(null)
  const hr = useRef(12), acc = useRef(0)
  const c = useMemo(() => ({ day: new THREE.Color('#8ec5ff'), night: new THREE.Color('#050a1a'), gray: new THREE.Color('#7b8794'), bg: new THREE.Color() }), [])
  useEffect(() => { scene.background = c.bg; scene.fog = new THREE.Fog(c.bg, 90, 220) }, [scene, c])
  useFrame((_, dt) => {
    const s = useCity.getState()
    if (!s.auto) hr.current = s.hour
    else { hr.current = (hr.current + dt * 0.4) % 24; acc.current += dt; if (acc.current > 0.25) { acc.current = 0; s.set({ hour: hr.current }) } }
    const d = daylight(hr.current)
    const wf = s.weather === 'sunny' ? 1 : s.weather === 'cloudy' ? 0.65 : 0.45
    c.bg.lerpColors(c.night, c.day, d)
    if (s.weather !== 'sunny') c.bg.lerp(c.gray, (1 - wf) * (0.9 * d + 0.2))
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(c.bg)
    const a = ((hr.current - 6) / 12) * Math.PI
    const sx = -Math.cos(a) * 90, sy = Math.sin(a) * 90
    sunM.current?.position.set(sx, sy, 30); moonM.current?.position.set(-sx, -sy, -30)
    if (sunL.current) { sunL.current.position.set(sy > 0 ? sx : -sx, Math.abs(sy) + 10, sy > 0 ? 30 : -30); sunL.current.intensity = d * 1.3 * wf + (1 - d) * 0.25; sunL.current.color.set(d > 0.4 ? '#fff4e0' : '#9db4ff') }
    if (amb.current) amb.current.intensity = 0.12 + 0.5 * d * wf
  })
  return <>
    <ambientLight ref={amb} />
    <directionalLight ref={sunL} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={70} shadow-camera-bottom={-70} shadow-camera-far={300} />
    <mesh ref={sunM}><sphereGeometry args={[5, 12, 12]} /><meshBasicMaterial color="#fff2a8" fog={false} /></mesh>
    <mesh ref={moonM}><sphereGeometry args={[3.5, 12, 12]} /><meshBasicMaterial color="#dbeafe" fog={false} /></mesh>
  </>
}

interface OC { target: THREE.Vector3; update: () => void }
function Rig() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as unknown as OC | null
  const tick = useCity((s) => s.camTick), focus = useCity((s) => s.focusTick)
  useEffect(() => {
    if (!controls) return
    const cam = useCity.getState().cam
    if (cam === 'top') { camera.position.set(0, 130, 0.1); controls.target.set(0, 0, 0) }
    else if (cam === 'street') { camera.position.set(-50, 3, 1.6); controls.target.set(0, 3, 1.6) }
    else { camera.position.set(60, 45, 60); controls.target.set(0, 0, 0) }
    controls.update()
  }, [tick, controls, camera])
  useEffect(() => {
    const b = BUILDINGS.find((x) => x.id === useCity.getState().selected)
    if (!controls || !b || focus === 0) return
    controls.target.set(b.pos[0], 0, b.pos[1]); camera.position.set(b.pos[0] + 25, 20, b.pos[1] + 25); controls.update()
  }, [focus, controls, camera])
  return null
}

export default function CityScene() {
  const set = useCity((s) => s.set)
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [60, 45, 60], fov: 50, far: 400 }} onPointerMissed={() => set({ selected: null })}>
      <Env /><Rig /><Roads /><TrafficLights /><StreetLights /><Cars /><Rain />
      {BUILDINGS.map((b) => <BuildingMesh key={b.id} b={b} />)}
      <OrbitControls makeDefault maxPolarAngle={1.52} maxDistance={170} />
    </Canvas>
  )
}
