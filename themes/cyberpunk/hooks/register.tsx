import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// Soft neon night city: slate-violet surfaces, muted pink and teal.
const { theme, problems } = makeColors({
  label: 'Cyberpunk',
  only: 'dark',
  roles: { accent: '#d977b4', danger: '#e0606f', success: '#62c99a', warning: '#ddb35c', pro: '#5fc4c0' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#11101a',
        'surface-1': '#171622',
        'surface-2': '#1c1b29',
        'surface-3': '#201e2e',
        'text-primary': '#ecebf3',
        'text-secondary': '#c4c2d4',
        'text-muted': '#9f9cb4',
      },
    },
  },
})

// Skyline with slowly blinking windows over a still neon grid.
function buildings(): string {
  const out: string[] = []
  let x = 0
  let seed = 7
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  while (x < 1600) {
    const w = 40 + Math.floor(rnd() * 70)
    const h = 140 + Math.floor(rnd() * 320)
    const y = 640 - h
    out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0d0820" stroke="#2a1650" stroke-width="1"/>`)
    for (let wy = y + 14; wy < 620; wy += 22) {
      for (let wx = x + 8; wx < x + w - 8; wx += 14) {
        const r = rnd()
        if (r < 0.22) {
          const color = r < 0.11 ? '#d977b4' : '#5fc4c0'
          const cls = r < 0.04 ? ' class="blink"' : ''
          out.push(`<rect x="${wx}" y="${wy}" width="6" height="8" fill="${color}" opacity="0.4"${cls}/>`)
        }
      }
    }
    x += w + 4
  }
  return out.join('')
}

const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#05020c"/><stop offset="0.6" stop-color="#1a0833"/><stop offset="1" stop-color="#3a0a4a"/>
</linearGradient>
<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#d977b4"/><stop offset="1" stop-color="#d99a6c"/>
</linearGradient>
</defs>
<style>
.blink { animation: blink 7s ease-in-out infinite; }
@keyframes blink { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.15; } }
</style>
<rect width="1600" height="900" fill="url(#sky)"/>
<circle cx="1180" cy="430" r="170" fill="url(#sun)" opacity="0.22"/>
<g>${buildings()}</g>
<rect x="0" y="640" width="1600" height="260" fill="#07030f"/>
<line x1="0" y1="640" x2="1600" y2="640" stroke="#d977b4" stroke-width="2" opacity="0.5"/>
<svg x="0" y="640" width="1600" height="260" viewBox="0 0 1600 260" preserveAspectRatio="none">
<g stroke="#d977b4" stroke-opacity="0.18" stroke-width="1">
<line x1="0" y1="0" x2="1600" y2="0"/><line x1="0" y1="40" x2="1600" y2="40"/><line x1="0" y1="80" x2="1600" y2="80"/>
<line x1="0" y1="120" x2="1600" y2="120"/><line x1="0" y1="160" x2="1600" y2="160"/><line x1="0" y1="200" x2="1600" y2="200"/>
<line x1="0" y1="240" x2="1600" y2="240"/><line x1="0" y1="-40" x2="1600" y2="-40"/>
</g>
<g stroke="#5fc4c0" stroke-opacity="0.14" stroke-width="1">
${Array.from({ length: 21 }, (_, i) => `<line x1="${800 + (i - 10) * 30}" y1="0" x2="${800 + (i - 10) * 260}" y2="260"/>`).join('')}
</g>
</svg>
</svg>`

const BASE: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'night-city', glass: { blur: 16, tint: '#11101a', opacity: 0.75 } },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    const set = await $.theme.set(BASE)
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
    return <Svg source={SCENE} alt="A neon city skyline at night with softly blinking windows and a neon grid" isInteractive />
  })
}
