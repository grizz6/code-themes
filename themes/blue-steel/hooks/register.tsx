import type { Register, ThemeColors, ThemeSetArgs, ThemeStyle } from 'claude-code'

import { makeColors } from './make-colors.js'

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const C = {
  skyTop: '#0c0f14',
  skyHorizon: '#262e3b',
  ridgeFar: '#2b3340',
  ridgeMid: '#3b4555',
  ridgeNear: '#11151c',
  light: '#f8fafc',
  text: '#eef1f7',
  // rgba(238,241,247,0.6) laid over #0c0f14, as six-digit hex
  textMuted: '#94979c',
  accent: '#cbd5e1',
  accent2: '#94a3b8',
  lantern: '#ffd08a',
} as const

const { theme, problems } = makeColors({
  label: 'Blue Steel',
  only: 'dark',
  roles: { accent: C.accent, danger: '#f87171', success: '#4ade80', warning: '#fbbf24', pro: C.accent2 },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0c0f14',
        'surface-1': '#11151c',
        'surface-2': '#151a22',
        'surface-3': '#191f28',
        'text-primary': C.text,
        'text-secondary': '#c4c9d2',
        'text-muted': C.textMuted,
      },
    },
    git: { added: '#4ade80', removed: '#f87171', modified: '#fbbf24' },
  },
})

// ---------------------------------------------------------------------------
// Scene: a moonlit range, built once as SVG with slow CSS motion
// ---------------------------------------------------------------------------

const W = 1600
const H = 900

// A small seeded random, so the scene is the same on every load.
let seed = 20261124
function rnd(): number {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}

const f = (n: number) => n.toFixed(1)

type Ridge = (x: number) => number

const farRidge: Ridge = x => 560 + 46 * Math.sin(x / 210 + 0.6) + 22 * Math.sin(x / 83 + 2.1) + 10 * Math.sin(x / 31)
const midRidge: Ridge = x => 655 + 40 * Math.sin(x / 170 + 2.4) + 18 * Math.sin(x / 61 + 0.3) + 7 * Math.sin(x / 23 + 1)
const nearRidge: Ridge = x => 780 + 26 * Math.sin(x / 260 + 1.2) + 10 * Math.sin(x / 97 + 0.4)

// Ridges are drawn wider than the screen so their slow sway never shows an edge.
function ridgePath(y: Ridge): string {
  const pts: string[] = []
  for (let x = -120; x <= W + 120; x += 8) {
    pts.push(`${f(x)} ${f(y(x))}`)
  }
  return `M-120 ${H} L${pts.join(' L')} L${W + 120} ${H} Z`
}

// Snow caps on the far peaks: they follow the ridge line and taper to nothing where the peak ends.
function snowCaps(y: Ridge, threshold: number): string {
  const out: string[] = []
  let run: number[] = []
  const depth = (x: number) => Math.min(26, (threshold - y(x)) * 0.9) * (0.75 + 0.25 * Math.sin(x / 7))
  const flush = () => {
    if (run.length > 3) {
      const top = run.map(x => `${f(x)} ${f(y(x))}`).join(' L')
      const bottom = [...run].reverse().map(x => `${f(x)} ${f(y(x) + Math.max(0, depth(x)))}`).join(' L')
      out.push(`<path d="M${top} L${bottom} Z" fill="${C.light}" opacity="0.28"/>`)
    }
    run = []
  }
  for (let x = -120; x <= W + 120; x += 4) {
    if (y(x) < threshold) {
      run.push(x)
    } else {
      flush()
    }
  }
  flush()
  return out.join('')
}

function stars(): string {
  const out: string[] = []
  for (let i = 0; i < 90; i++) {
    const x = rnd() * W
    const yMax = farRidge(x) - 30
    const y = rnd() * Math.max(40, yMax)
    const r = 0.5 + rnd() * 1.1
    const dur = 7 + rnd() * 9 // slow twinkles, well under any flash limit
    const delay = rnd() * dur
    out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" class="tw" style="animation-duration:${f(dur)}s;animation-delay:-${f(delay)}s"/>`)
  }
  return out.join('')
}

function snow(): string {
  const out: string[] = []
  for (let i = 0; i < 70; i++) {
    const x = rnd() * W
    const r = 0.7 + rnd() * 1.4
    const dur = 36 + rnd() * 30
    const delay = rnd() * dur
    const sway = 14 + rnd() * 26
    out.push(
      `<g class="sn" style="animation-duration:${f(dur)}s;animation-delay:-${f(delay)}s">` +
        `<circle cx="${f(x)}" cy="-10" r="${f(r)}" class="sw" style="--s:${f(sway)}px;animation-duration:${f(6 + rnd() * 6)}s"/></g>`,
    )
  }
  return out.join('')
}

// The hiker walks along the nearest ridge: keyframes follow the ridge line point by point.
function hikerKeyframes(): string {
  const x0 = 120
  const x1 = 1480
  const steps = 40
  const lines: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps
    const pct = (i / steps) * 100
    lines.push(`${f(pct)}% { transform: translate(${f(x)}px, ${f(nearRidge(x))}px); }`)
  }
  return `@keyframes walk { ${lines.join(' ')} }`
}

const HIKER = `
<g class="hiker">
  <g class="bob">
    <circle cx="0" cy="-21" r="3" fill="${C.ridgeNear}"/>
    <path d="M-3 -18 L3 -18 L4 -8 L-4 -8 Z" fill="${C.ridgeNear}"/>
    <path d="M-4 -18 L-7 -17 L-7 -10 L-4 -10 Z" fill="${C.ridgeNear}"/>
    <path d="M-3 -8 L-5 0 M3 -8 L5 0" stroke="${C.ridgeNear}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M3 -16 L8 -12" stroke="${C.ridgeNear}" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="9" cy="-10" r="14" fill="url(#lanternGlow)" class="lglow"/>
    <circle cx="9" cy="-10" r="1.8" fill="${C.lantern}"/>
  </g>
</g>`

function birds(): string {
  const flock: string[] = []
  const spots = [
    [0, 0],
    [-18, 8],
    [-30, -6],
    [-44, 12],
  ]
  for (const [dx, dy] of spots) {
    flock.push(
      `<g transform="translate(${dx} ${dy})"><path class="wing" d="M-7 0 Q-3.5 -5 0 0 Q3.5 -5 7 0" fill="none" stroke="${C.ridgeNear}" stroke-width="1.4" stroke-linecap="round" style="animation-delay:-${f(rnd())}s"/></g>`,
    )
  }
  return flock.join('')
}

const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${C.skyTop}"/><stop offset="0.72" stop-color="${C.skyHorizon}"/><stop offset="1" stop-color="${C.skyHorizon}"/>
</linearGradient>
<radialGradient id="moonGlow"><stop offset="0" stop-color="${C.light}" stop-opacity="0.32"/><stop offset="1" stop-color="${C.light}" stop-opacity="0"/></radialGradient>
<radialGradient id="lanternGlow"><stop offset="0" stop-color="${C.lantern}" stop-opacity="0.75"/><stop offset="1" stop-color="${C.lantern}" stop-opacity="0"/></radialGradient>
<linearGradient id="streak" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.light}" stop-opacity="0"/><stop offset="1" stop-color="${C.light}" stop-opacity="0.9"/></linearGradient>
</defs>
<style>
.tw { fill: ${C.light}; opacity: 0.6; animation: tw 10s ease-in-out infinite; }
@keyframes tw { 0%, 100% { opacity: 0.7; } 50% { opacity: 0.2; } }
.moonglow { animation: mg 24s ease-in-out infinite; transform-origin: 1240px 170px; }
@keyframes mg { 0%, 100% { opacity: 0.85; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
@media (max-aspect-ratio: 1/1) { .moon { transform: translate(-400px, 60px); } }
.far { animation: sway 240s ease-in-out infinite alternate; }
.mid { animation: sway2 180s ease-in-out infinite alternate; }
.near { animation: sway3 140s ease-in-out infinite alternate; }
@keyframes sway { from { transform: translateX(-30px); } to { transform: translateX(30px); } }
@keyframes sway2 { from { transform: translateX(45px); } to { transform: translateX(-45px); } }
@keyframes sway3 { from { transform: translateX(-70px); } to { transform: translateX(70px); } }
.sn { animation: fall 50s linear infinite; }
@keyframes fall { from { transform: translateY(0); } to { transform: translateY(${H + 30}px); } }
.sw { fill: ${C.light}; opacity: 0.55; animation: sw 8s ease-in-out infinite alternate; }
@keyframes sw { from { transform: translateX(calc(var(--s) * -1)); } to { transform: translateX(var(--s)); } }
.shoot { opacity: 0; animation: shoot 14s linear infinite; }
@keyframes shoot { 0% { opacity: 0; transform: translate(0, 0); } 1% { opacity: 1; } 7% { opacity: 0; transform: translate(-340px, 150px); } 100% { opacity: 0; transform: translate(-340px, 150px); } }
.hiker { animation: walk 360s linear infinite; }
${hikerKeyframes()}
.bob { animation: bob 1.6s ease-in-out infinite; }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1px); } }
.lglow { animation: lg 5s ease-in-out infinite; }
@keyframes lg { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
.flock { animation: fly 110s linear infinite; }
.flock2 { animation: fly2 150s linear infinite; animation-delay: -60s; }
@keyframes fly { from { transform: translate(-80px, 260px); } to { transform: translate(${W + 80}px, 200px); } }
@keyframes fly2 { from { transform: translate(${W + 80}px, 150px); } to { transform: translate(-80px, 210px); } }
.wing { animation: flap 1.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes flap { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(-0.6); } }
</style>
<rect width="${W}" height="${H}" fill="${C.skyTop}"/>
<g opacity="0.82">
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<g>${stars()}</g>
<g class="moon"><circle cx="1240" cy="170" r="150" fill="url(#moonGlow)" class="moonglow"/>
<circle cx="1240" cy="170" r="34" fill="${C.light}" opacity="0.92"/>
<circle cx="1251" cy="162" r="6" fill="#e2e8f0" opacity="0.5"/>
<circle cx="1229" cy="181" r="4" fill="#e2e8f0" opacity="0.45"/></g>
<g class="shoot"><line x1="1180" y1="60" x2="1290" y2="12" stroke="url(#streak)" stroke-width="1.6" stroke-linecap="round"/></g>
<g class="shoot" style="animation-delay:-7s;animation-duration:17s"><line x1="620" y1="110" x2="720" y2="66" stroke="url(#streak)" stroke-width="1.3" stroke-linecap="round"/></g>
<g class="flock">${birds()}</g>
<g class="flock2"><g transform="scale(-0.8 0.8)">${birds()}</g></g>
<g class="far"><path d="${ridgePath(farRidge)}" fill="${C.ridgeFar}"/>${snowCaps(farRidge, 540)}</g>
<g class="mid"><path d="${ridgePath(midRidge)}" fill="${C.ridgeMid}" opacity="0.9"/></g>
<g>${snow()}</g>
<g class="near"><path d="${ridgePath(nearRidge)}" fill="${C.ridgeNear}"/>${HIKER}</g>
</g>
</svg>`

// ---------------------------------------------------------------------------
// Conversation styling: frosted glass, 12pt corners, accent for your messages
// ---------------------------------------------------------------------------

const GLASS = '#0c0f149e' // rgba(12,15,20,0.62)
const EDGE = '#eef1f71a' // rgba(238,241,247,0.1)

const STYLE: ThemeStyle = {
  Text: { fontFamily: ['sans'], color: C.text },
  Heading: { fontFamily: ['sans'], fontWeight: 'semibold', color: C.text },
  UserMessage: {
    color: '#0c0f14',
    backgroundColor: C.accent,
    radius: 12,
    paddingX: 14,
    paddingY: 10,
  },
  AssistantMessage: {
    color: C.text,
    backgroundColor: GLASS,
    borderColor: EDGE,
    borderWidth: 1,
    radius: 12,
    padding: 14,
  },
  ToolUse: { color: C.accent2, fontFamily: ['code'], backgroundColor: GLASS, borderColor: EDGE, borderWidth: 1, radius: 12, paddingX: 10 },
}

const colors: ThemeColors = theme

const BASE: ThemeSetArgs = {
  colors,
  overrideColorScheme: 'dark',
  backdrop: { scene: 'blue-steel-range', glass: { blur: 11, tint: C.skyTop, opacity: 0.62 } },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    let set
    try {
      set = await $.theme.set({ ...BASE, style: STYLE })
    } catch (error) {
      // An older app build that doesn't take `style`: keep the colours and scene.
      $.ui.log(String(error))
      set = await $.theme.set(BASE)
    }
    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    return (
      <Svg
        source={SCENE}
        alt="A moonlit mountain range at night with falling snow and a hiker carrying a lantern along the nearest ridge"
        isInteractive
      />
    )
  })
}
