// Painted backgrounds, drawn as SVG. One drawing per room; time of day and rain are overlays.
// Canvas is 1600x900; the stage scales it with preserveAspectRatio="xMidYMid slice".

const W = 1600, H = 900;

export const TIMES = {
  dawn:  { sky: ['#f3c9a8', '#c9d3e6'], tint: '#ffb98a', tintA: 0.10, lamps: false, sun: '#fff1d6' },
  day:   { sky: ['#bfdcef', '#eef3ea'], tint: '#ffffff', tintA: 0.00, lamps: false, sun: '#fffbe9' },
  dusk:  { sky: ['#f19a62', '#6f6496'], tint: '#ff9a5c', tintA: 0.16, lamps: true,  sun: '#ffd29a' },
  night: { sky: ['#141a33', '#2f3560'], tint: '#141a40', tintA: 0.34, lamps: true,  sun: '#cfd8ff' }
};

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function defs(time, weather) {
  const T = TIMES[time] || TIMES.day;
  const rain = weather === 'rain';
  const sky = rain ? (time === 'night' ? ['#151a28', '#2b3142'] : ['#8d97a6', '#c3c8cf']) : T.sky;
  return `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/>
    </linearGradient>
    <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffe2a8" stop-opacity="0.85"/>
      <stop offset="0.35" stop-color="#ffc977" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffb35c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#1b1208" stop-opacity="0.38"/>
    </radialGradient>
    <linearGradient id="floorWood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b98a5e"/><stop offset="1" stop-color="#8a5f3c"/>
    </linearGradient>
    <linearGradient id="wallWarm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f1e3c8"/><stop offset="1" stop-color="#e2cfaa"/>
    </linearGradient>
    <filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="paper">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.25  0 0 0 0.09 0"/>
    </filter>
  </defs>`;
}

// A window that shows the outside: sky, a low city line, maybe the bridge, rain streaks.
function windowView(x, y, w, h, time, weather, opts = {}) {
  const T = TIMES[time] || TIMES.day;
  const r = rng(x * 7 + y);
  const id = `win${x}${y}`;
  let city = '';
  const base = y + h * (opts.horizon ?? 0.72);
  let cx = x - 10;
  while (cx < x + w + 10) {
    const bw = 30 + r() * 60, bh = 30 + r() * h * 0.35;
    city += `<rect x="${cx.toFixed(1)}" y="${(base - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${(bh + h).toFixed(1)}" fill="${time === 'night' ? '#1d2140' : '#8f8aa3'}" opacity="${time === 'night' ? 0.95 : 0.55}"/>`;
    if (T.lamps) {
      for (let k = 0; k < 4; k++) {
        if (r() < 0.55) city += `<rect x="${(cx + 6 + r() * (bw - 14)).toFixed(1)}" y="${(base - bh + 8 + r() * (bh - 12)).toFixed(1)}" width="5" height="7" fill="#ffd98a" opacity="${0.6 + r() * 0.4}"/>`;
      }
    }
    cx += bw + 4;
  }
  const stars = time === 'night' && weather !== 'rain'
    ? Array.from({ length: 14 }, () => `<circle cx="${(x + r() * w).toFixed(1)}" cy="${(y + r() * h * 0.5).toFixed(1)}" r="${(0.8 + r() * 1.4).toFixed(1)}" fill="#fff" opacity="${0.4 + r() * 0.6}"/>`).join('')
    : '';
  const sun = !opts.noSun && weather !== 'rain' && time !== 'day'
    ? `<circle cx="${x + w * 0.72}" cy="${y + h * (time === 'night' ? 0.22 : 0.5)}" r="${time === 'night' ? 16 : 28}" fill="${T.sun}" opacity="0.9"/>`
    : '';
  const streaks = weather === 'rain'
    ? Array.from({ length: Math.round(w / 9) }, () => {
        const sx = x + r() * w, sy = y + r() * h, len = 18 + r() * 30;
        return `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(sx - 4).toFixed(1)}" y2="${(sy + len).toFixed(1)}" stroke="#dfe7f2" stroke-width="1.2" opacity="0.45"/>`;
      }).join('')
    : '';
  return `
  <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/></clipPath>
  <g clip-path="url(#${id})">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sky)"/>
    ${stars}${sun}
    ${opts.bridge ? bridge(x, base - 10, w, time) : ''}
    ${city}${streaks}
  </g>`;
}

function bridge(x, y, w, time) {
  const lights = TIMES[time]?.lamps;
  let s = `<path d="M${x - 20} ${y} Q ${x + w * 0.5} ${y - 70} ${x + w + 20} ${y}" stroke="${time === 'night' ? '#39406b' : '#6e6a85'}" stroke-width="6" fill="none"/>`;
  s += `<rect x="${x - 20}" y="${y}" width="${w + 40}" height="8" fill="${time === 'night' ? '#2d3358' : '#77738d'}"/>`;
  for (let i = 0; i <= 10; i++) {
    const px = x + (w * i) / 10;
    s += `<line x1="${px}" y1="${y}" x2="${px}" y2="${y - 70 * (1 - Math.pow((i - 5) / 5, 2))}" stroke="${time === 'night' ? '#39406b' : '#6e6a85'}" stroke-width="2"/>`;
    if (lights) s += `<circle cx="${px}" cy="${y - 2}" r="3" fill="#ffd27a"/>`;
  }
  if (lights) s += `<circle cx="${x + w * 0.5}" cy="${y - 74}" r="5" fill="#ff6b5a"><animate attributeName="opacity" values="1;0.2;1" dur="2.4s" repeatCount="indefinite"/></circle>`;
  return s;
}

// Glows are collected while a room draws and painted above the time-of-day tint,
// so lamps stay warm at night instead of being darkened with the room.
let GLOWS = [];
function lampGlow(cx, cy, r, on) {
  if (!on) return '';
  GLOWS.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#lamp)" style="mix-blend-mode:screen"><animate attributeName="r" values="${r};${r * 1.03};${r}" dur="5s" repeatCount="indefinite"/></circle>`);
  return '';
}

function floorBoards(y0) {
  let s = `<rect x="0" y="${y0}" width="${W}" height="${H - y0}" fill="url(#floorWood)"/>`;
  for (let i = 1; i < 7; i++) {
    const y = y0 + (H - y0) * Math.pow(i / 7, 1.4);
    s += `<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}" stroke="#6f4a2c" stroke-width="1.5" opacity="0.35"/>`;
  }
  return s;
}

function pothos(x, y) {
  let s = `<path d="M${x - 34} ${y} h68 l-8 46 h-52 z" fill="#c8775a"/>`;
  const r = rng(x + y);
  for (let v = 0; v < 4; v++) {
    let px = x - 20 + v * 13, py = y + 4;
    let d = `M${px} ${py}`;
    for (let k = 0; k < 7; k++) {
      const nx = px + (r() - 0.5) * 40 + (v - 1.5) * 8, ny = py + 22 + r() * 14;
      d += ` Q ${px + (r() - 0.5) * 30} ${py + 10} ${nx.toFixed(1)} ${ny.toFixed(1)}`;
      s += `<ellipse cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" rx="11" ry="7" fill="${r() < 0.5 ? '#5f9a52' : '#78b062'}" transform="rotate(${(r() * 80 - 40).toFixed(0)} ${nx.toFixed(1)} ${ny.toFixed(1)})"/>`;
      px = nx; py = ny;
    }
    s = `<path d="${d}" stroke="#4d7d43" stroke-width="2.5" fill="none"/>` + s;
  }
  for (let k = 0; k < 8; k++) s += `<ellipse cx="${x - 26 + k * 7}" cy="${y - 6 - (k % 3) * 6}" rx="12" ry="8" fill="#6aa65a"/>`;
  return s;
}

function stickyNotes(x, y, cols, rows, seed) {
  const r = rng(seed), colors = ['#ffe58a', '#ffc2a8', '#b9e3c6', '#bcd6f5', '#f6c6e3'];
  let s = '';
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    if (r() < 0.25) continue;
    const nx = x + i * 46 + r() * 8, ny = y + j * 50 + r() * 8;
    s += `<g transform="rotate(${(r() * 14 - 7).toFixed(1)} ${nx + 18} ${ny + 18})"><rect x="${nx}" y="${ny}" width="38" height="38" fill="${colors[Math.floor(r() * colors.length)]}"/>`;
    for (let l = 0; l < 3; l++) s += `<line x1="${nx + 6}" y1="${ny + 10 + l * 9}" x2="${nx + 14 + r() * 18}" y2="${ny + 10 + l * 9}" stroke="#7b6a58" stroke-width="1.6" opacity="0.6"/>`;
    s += `</g>`;
  }
  return s;
}

// ─────────────────────────── rooms ───────────────────────────

function living(time, weather) {
  const lamps = TIMES[time].lamps || weather === 'rain';
  return `
  <rect width="${W}" height="${H}" fill="url(#wallWarm)"/>
  <rect x="0" y="0" width="${W}" height="40" fill="#d8c29b"/>
  ${floorBoards(640)}
  <rect x="0" y="628" width="${W}" height="16" fill="#a77d55"/>
  <!-- window -->
  <rect x="150" y="120" width="520" height="400" fill="#8a6a4a" rx="8"/>
  ${windowView(166, 136, 488, 368, time, weather)}
  <line x1="410" y1="136" x2="410" y2="504" stroke="#8a6a4a" stroke-width="10"/>
  <line x1="166" y1="320" x2="654" y2="320" stroke="#8a6a4a" stroke-width="8"/>
  <path d="M130 108 q 60 210 0 430 h 40 q 40 -215 0 -430 z" fill="#e6b392" opacity="0.92"/>
  <path d="M690 108 q -60 210 0 430 h -40 q -40 -215 0 -430 z" fill="#e6b392" opacity="0.92"/>
  <rect x="140" y="520" width="540" height="22" fill="#9a7552" rx="4"/>
  ${pothos(560, 520)}
  <!-- residents chart -->
  <g transform="rotate(-2 930 230)">
    <rect x="800" y="120" width="300" height="230" fill="#fbf6ea" stroke="#d9cbb0"/>
    <rect x="820" y="140" width="125" height="85" fill="none" stroke="#5b7c99" stroke-width="3"/>
    <rect x="955" y="140" width="125" height="85" fill="none" stroke="#d9825b" stroke-width="3"/>
    <rect x="820" y="240" width="125" height="90" fill="none" stroke="#6a9a6e" stroke-width="3"/>
    <rect x="955" y="240" width="125" height="90" fill="none" stroke="#b79b70" stroke-width="3" stroke-dasharray="6 5"/>
    <circle cx="882" cy="180" r="14" fill="#5b7c99"/><circle cx="1017" cy="180" r="14" fill="#d9825b"/>
    <circle cx="882" cy="282" r="14" fill="#6a9a6e"/><text x="1017" y="292" font-size="30" text-anchor="middle" fill="#b79b70">?</text>
    <circle cx="1060" cy="318" r="7" fill="#c9a36b"/>
    <circle cx="950" cy="124" r="6" fill="#d24b3e"/>
  </g>
  <!-- floor lamp -->
  <line x1="1460" y1="250" x2="1460" y2="640" stroke="#4a3a2a" stroke-width="6"/>
  <ellipse cx="1460" cy="642" rx="40" ry="8" fill="#4a3a2a"/>
  <path d="M1400 250 h120 l-26 -80 h-68 z" fill="${lamps ? '#ffe4ad' : '#e9d6b3'}" stroke="#c6a678" stroke-width="2"/>
  ${lampGlow(1460, 230, 340, lamps)}
  <!-- sofa -->
  <g>
    <rect x="980" y="470" width="420" height="190" rx="40" fill="#7f8f6a"/>
    <rect x="950" y="510" width="80" height="170" rx="30" fill="#71815e"/>
    <rect x="1350" y="510" width="80" height="170" rx="30" fill="#71815e"/>
    <rect x="1020" y="560" width="340" height="90" rx="22" fill="#8c9c76"/>
    <rect x="1050" y="500" width="110" height="80" rx="18" fill="#e7b25c" transform="rotate(-8 1105 540)"/>
    <rect x="1230" y="505" width="100" height="74" rx="18" fill="#d7a9a0" transform="rotate(6 1280 540)"/>
    <rect x="1090" y="410" width="90" height="120" fill="#efe7d6" stroke="#a89474" transform="rotate(-12 1135 470)"/>
  </g>
  <!-- folding table -->
  <g transform="translate(470 40)">
  <ellipse cx="700" cy="720" rx="190" ry="40" fill="#5a3d26" opacity="0.25"/>
  <rect x="520" y="660" width="360" height="22" rx="6" fill="#a87b4f"/>
  <line x1="560" y1="682" x2="540" y2="790" stroke="#7b5636" stroke-width="10"/>
  <line x1="840" y1="682" x2="860" y2="790" stroke="#7b5636" stroke-width="10"/>
  <rect x="610" y="634" width="46" height="28" rx="6" fill="#f4f0e6"/><path d="M656 640 q 16 6 0 18" stroke="#f4f0e6" stroke-width="5" fill="none"/>
  <rect x="740" y="642" width="70" height="20" rx="3" fill="#c96f4e"/>
  </g>`;
}

function kitchen(time, weather) {
  const lamps = TIMES[time].lamps || weather === 'rain';
  let tiles = '';
  for (let x = 0; x < W; x += 64) for (let y = 300; y < 640; y += 48) tiles += `<rect x="${x + ((y / 48) % 2) * 32}" y="${y}" width="62" height="46" fill="#e8efe9" stroke="#cfd9d2" stroke-width="2"/>`;
  return `
  <rect width="${W}" height="${H}" fill="#e4ddc8"/>
  ${tiles}
  ${floorBoards(700)}
  <!-- small window -->
  <rect x="660" y="90" width="330" height="200" fill="#8a6a4a" rx="6"/>
  ${windowView(674, 104, 302, 172, time, weather, { horizon: 0.8 })}
  <line x1="825" y1="104" x2="825" y2="276" stroke="#8a6a4a" stroke-width="7"/>
  <!-- shelves -->
  <rect x="1140" y="150" width="380" height="14" fill="#9a7552"/>
  ${[0, 1, 2, 3, 4].map(i => `<rect x="${1160 + i * 70}" y="${102 + (i % 2) * 8}" width="44" height="${48 - (i % 2) * 8}" rx="6" fill="${['#c8775a', '#e2c38a', '#7fa0b8', '#d9d2c3', '#9ab48a'][i]}"/>`).join('')}
  <!-- counter -->
  <rect x="560" y="560" width="1040" height="150" fill="#b8916b"/>
  <rect x="540" y="540" width="1060" height="30" rx="6" fill="#efe6d6"/>
  ${[0, 1, 2, 3].map(i => `<rect x="${600 + i * 250}" y="590" width="220" height="100" rx="6" fill="#a98460" stroke="#8b6a4b"/><circle cx="${700 + i * 250}" cy="640" r="5" fill="#6d4f35"/>`).join('')}
  <!-- stove + clay pot -->
  <rect x="1180" y="520" width="240" height="24" rx="4" fill="#3d3a38"/>
  <path d="M1230 520 q 0 -70 70 -70 q 70 0 70 70 z" fill="#7a4a35"/>
  <ellipse cx="1300" cy="452" rx="44" ry="10" fill="#5e3828"/>
  <circle cx="1300" cy="440" r="8" fill="#5e3828"/>
  ${lamps ? `<path d="M1285 430 q -14 -30 6 -55 q 16 -20 -2 -45" stroke="#fff" stroke-width="5" fill="none" opacity="0.35" filter="url(#soft)"><animate attributeName="opacity" values="0.15;0.4;0.15" dur="4s" repeatCount="indefinite"/></path>` : ''}
  <!-- fridge -->
  <rect x="150" y="190" width="300" height="520" rx="22" fill="#f3efe6" stroke="#cfc6b4" stroke-width="3"/>
  <line x1="150" y1="390" x2="450" y2="390" stroke="#cfc6b4" stroke-width="3"/>
  <rect x="410" y="250" width="12" height="90" rx="6" fill="#bdb4a0"/><rect x="410" y="420" width="12" height="120" rx="6" fill="#bdb4a0"/>
  ${stickyNotes(172, 210, 5, 3, 11)}
  ${stickyNotes(180, 410, 5, 2, 23)}
  <!-- pendant lamp -->
  <line x1="1040" y1="0" x2="1040" y2="330" stroke="#3a3027" stroke-width="3"/>
  <path d="M990 330 h100 q -10 -46 -50 -46 q -40 0 -50 46 z" fill="#c35f3a"/>
  ${lampGlow(1040, 360, 300, lamps)}`;
}

function rooftop(time, weather) {
  const r = rng(91);
  return `
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${windowView(0, 0, W, 700, time, weather, { bridge: true, horizon: 0.82 })}
  ${time === 'dusk' && weather !== 'rain' ? `<circle cx="1180" cy="520" r="90" fill="#ffcf8a" opacity="0.65" filter="url(#glow)"/>` : ''}
  <!-- parapet & floor -->
  <rect x="0" y="640" width="${W}" height="${H - 640}" fill="#a49a8c"/>
  <rect x="0" y="600" width="${W}" height="60" fill="#c3b8a6"/>
  ${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 84}" y1="600" x2="${i * 84}" y2="660" stroke="#a89d8b" stroke-width="2"/>`).join('')}
  ${Array.from({ length: 30 }, () => `<rect x="${(r() * W).toFixed(0)}" y="${(680 + r() * 200).toFixed(0)}" width="${(20 + r() * 50).toFixed(0)}" height="3" fill="#8e8476" opacity="0.6"/>`).join('')}
  <!-- clothesline -->
  <line x1="100" y1="330" x2="100" y2="660" stroke="#5c5149" stroke-width="7"/>
  <line x1="1000" y1="300" x2="1000" y2="660" stroke="#5c5149" stroke-width="7"/>
  <path d="M100 340 Q 550 400 1000 310" stroke="#ede5d8" stroke-width="2" fill="none"/>
  <g>
    <path d="M250 368 l 30 -8 l 20 14 l 22 -4 l -6 120 h -80 l 0 -100 z" fill="#f2f0ea"><animateTransform attributeName="transform" type="rotate" values="-2 280 365;2 280 365;-2 280 365" dur="5s" repeatCount="indefinite"/></path>
    <path d="M520 388 l 32 -6 l 20 12 l 26 -2 l -4 140 h -86 z" fill="#8fb3c9"><animateTransform attributeName="transform" type="rotate" values="2 555 385;-2 555 385;2 555 385" dur="6s" repeatCount="indefinite"/></path>
    <path d="M760 370 l 70 -8 l -8 90 h -56 z" fill="#e2a46a"><animateTransform attributeName="transform" type="rotate" values="-3 795 365;3 795 365;-3 795 365" dur="4.5s" repeatCount="indefinite"/></path>
  </g>
  <!-- chairs -->
  <g fill="#d6553e">
    <rect x="1160" y="610" width="130" height="18" rx="6"/><rect x="1170" y="520" width="110" height="96" rx="14"/>
    <rect x="1168" y="626" width="10" height="90"/><rect x="1272" y="626" width="10" height="90"/>
  </g>
  <g fill="#3f8fa3">
    <rect x="1340" y="620" width="130" height="18" rx="6"/><rect x="1350" y="530" width="110" height="96" rx="14"/>
    <rect x="1348" y="636" width="10" height="90"/><rect x="1452" y="636" width="10" height="90"/>
  </g>
  <!-- mint -->
  <path d="M1500 760 h80 l-10 70 h-60 z" fill="#b26a4a"/>
  ${Array.from({ length: 16 }, (_, i) => `<ellipse cx="${1510 + (i % 6) * 12}" cy="${745 - Math.floor(i / 6) * 18}" rx="12" ry="8" fill="${i % 2 ? '#6fb36a' : '#86c47b'}"/>`).join('')}
  ${weather === 'rain' ? Array.from({ length: 140 }, () => { const x = r() * W, y = r() * H; return `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - 6).toFixed(0)}" y2="${(y + 34).toFixed(0)}" stroke="#dbe4ef" stroke-width="1.4" opacity="0.5"/>`; }).join('') : ''}`;
}

function myroom(time, weather) {
  const lamps = TIMES[time].lamps || weather === 'rain';
  return `
  <rect width="${W}" height="${H}" fill="#e9dccb"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#d6c6ad" opacity="0.35"/>
  ${floorBoards(680)}
  <!-- big east window -->
  <rect x="520" y="90" width="560" height="440" fill="#8a6a4a" rx="8"/>
  ${windowView(536, 106, 528, 408, time, weather)}
  <line x1="800" y1="106" x2="800" y2="514" stroke="#8a6a4a" stroke-width="9"/>
  ${time === 'dawn' && weather !== 'rain' ? `<path d="M536 514 L 300 900 L 1000 900 L 1064 514 Z" fill="#ffe6b8" opacity="0.28"/>` : ''}
  <!-- desk -->
  <rect x="480" y="560" width="640" height="24" rx="6" fill="#a87b4f"/>
  <rect x="500" y="584" width="20" height="180" fill="#875f3b"/><rect x="1080" y="584" width="20" height="180" fill="#875f3b"/>
  <rect x="900" y="584" width="190" height="100" fill="#956a44"/>
  <rect x="580" y="520" width="160" height="40" rx="3" fill="#f5efe2" transform="rotate(-3 660 540)"/>
  <rect x="600" y="500" width="120" height="22" rx="3" fill="#6c8aa8"/>
  <!-- desk lamp -->
  <path d="M1010 560 h50 v-8 h-50 z" fill="#3b4048"/>
  <line x1="1035" y1="552" x2="1000" y2="470" stroke="#3b4048" stroke-width="6"/>
  <line x1="1000" y1="470" x2="950" y2="430" stroke="#3b4048" stroke-width="6"/>
  <path d="M920 452 l 40 -40 l 20 30 z" fill="#3b4048"/>
  ${lampGlow(940, 470, 220, lamps)}
  <!-- bed -->
  <rect x="1180" y="560" width="460" height="200" rx="18" fill="#e8e2d6"/>
  <rect x="1180" y="620" width="460" height="140" rx="10" fill="#9fb3c9"/>
  <rect x="1200" y="560" width="140" height="70" rx="22" fill="#fbf8f1"/>
  <rect x="1170" y="460" width="22" height="300" rx="8" fill="#9a7552"/>
  <!-- chair -->
  <rect x="680" y="610" width="140" height="18" rx="6" fill="#7b5636"/>
  <rect x="690" y="520" width="18" height="230" fill="#7b5636"/><rect x="792" y="520" width="18" height="230" fill="#7b5636"/>
  <!-- shelf with plant -->
  <rect x="100" y="300" width="260" height="14" fill="#9a7552"/>
  <path d="M150 300 h50 l-6 -36 h-38 z" fill="#d7a48a"/>
  ${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${163 + i * 6}" cy="${262 - (i % 2) * 8}" rx="9" ry="13" fill="#8fbf8a" transform="rotate(${-30 + i * 15} ${163 + i * 6} ${262 - (i % 2) * 8})"/>`).join('')}
  ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${230 + i * 20}" y="${236 + (i % 3) * 6}" width="16" height="${64 - (i % 3) * 6}" fill="${['#c96f4e', '#6c8aa8', '#e1b866', '#8a9f72', '#b28aa8', '#d9cdb5'][i]}"/>`).join('')}`;
}

function bookshop(time, weather) {
  const lamps = true;
  const r = rng(5);
  const palette = ['#8c3b2e', '#c4733f', '#d8b25f', '#5b7a5a', '#3f5a73', '#7d5c7a', '#b59e7e', '#e2d4b5', '#6f4b33'];
  const shelf = (x, y, w, h, rows) => {
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#6b4a2f"/>`;
    const rh = h / rows;
    for (let k = 0; k < rows; k++) {
      const by = y + k * rh;
      s += `<rect x="${x}" y="${by + rh - 10}" width="${w}" height="10" fill="#4f3522"/>`;
      let bx = x + 8;
      while (bx < x + w - 14) {
        const bw = 10 + r() * 18, bh = rh * (0.55 + r() * 0.35);
        const tilt = r() < 0.06 ? (r() * 14 + 4) : 0;
        s += `<rect x="${bx.toFixed(1)}" y="${(by + rh - 10 - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${palette[Math.floor(r() * palette.length)]}" transform="rotate(${tilt.toFixed(1)} ${(bx + bw).toFixed(1)} ${(by + rh - 10).toFixed(1)})"/>`;
        if (r() < 0.4) s += `<rect x="${(bx + 2).toFixed(1)}" y="${(by + rh - 10 - bh * 0.7).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="3" fill="#f3e7c8" opacity="0.6"/>`;
        bx += bw + 2;
      }
    }
    return s;
  };
  return `
  <rect width="${W}" height="${H}" fill="#5a3e28"/>
  ${floorBoards(720)}
  ${shelf(40, 40, 420, 680, 6)}
  ${shelf(1140, 40, 420, 680, 6)}
  <!-- glass door -->
  <rect x="560" y="120" width="480" height="600" fill="#3a2a1c"/>
  ${windowView(580, 140, 200, 560, time === 'day' ? 'day' : time, weather, { horizon: 0.85 })}
  ${windowView(820, 140, 200, 560, time === 'day' ? 'day' : time, weather, { horizon: 0.85, noSun: true })}
  <text x="800" y="230" font-size="46" text-anchor="middle" fill="#f3d9a0" opacity="0.85" font-family="serif">半页</text>
  <!-- counter -->
  <rect x="480" y="600" width="640" height="200" fill="#7a5233"/>
  <rect x="460" y="580" width="680" height="30" rx="6" fill="#9b6c44"/>
  <rect x="980" y="640" width="110" height="60" rx="4" fill="#6a4529" stroke="#4a301c"/>
  <circle cx="1035" cy="670" r="7" fill="#d9b25f"/>
  <!-- tea + stacked magazines (where the cat sleeps) -->
  <rect x="520" y="540" width="120" height="42" fill="#d9cdb5"/><rect x="525" y="520" width="110" height="22" fill="#b28aa8"/>
  <rect x="700" y="548" width="40" height="34" rx="5" fill="#f4efe4"/>
  ${[0, 1, 2].map(i => `<line x1="${400 + i * 400}" y1="0" x2="${400 + i * 400}" y2="120" stroke="#2c1f14" stroke-width="3"/><path d="M${370 + i * 400} 120 h60 q -6 -34 -30 -34 q -24 0 -30 34 z" fill="#d79a4a"/>${lampGlow(400 + i * 400, 150, 280, lamps)}`).join('')}`;
}

function stairs(time, weather) {
  const lamps = time !== 'day';
  let steps = '';
  for (let i = 0; i < 9; i++) {
    const x = 380 + i * 110, y = 820 - i * 70;
    steps += `<rect x="${x}" y="${y}" width="140" height="70" fill="${i % 2 ? '#bfb4a3' : '#b3a895'}"/><rect x="${x}" y="${y}" width="140" height="8" fill="#d7ccba"/>`;
  }
  return `
  <rect width="${W}" height="${H}" fill="#d9cfbd"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#9fae9a" opacity="0.18"/>
  <rect x="0" y="560" width="${W}" height="340" fill="#cdbfa8"/>
  <rect x="0" y="540" width="${W}" height="24" fill="#8fa38f" opacity="0.5"/>
  <!-- peeling paint -->
  <path d="M220 200 q 30 -10 50 10 q -10 30 -40 20 z" fill="#efe7d8"/><path d="M1300 300 q 40 -6 54 20 q -24 20 -50 4 z" fill="#efe7d8"/>
  <!-- stair window -->
  <rect x="1220" y="120" width="220" height="260" fill="#7b6a58" rx="4"/>
  ${windowView(1232, 132, 196, 236, time, weather)}
  ${steps}
  <path d="M380 760 L 1370 130" stroke="#5a4636" stroke-width="10" stroke-linecap="round"/>
  ${Array.from({ length: 10 }, (_, i) => `<line x1="${400 + i * 100}" y1="${748 - i * 63.6}" x2="${400 + i * 100}" y2="${830 - i * 70}" stroke="#5a4636" stroke-width="4"/>`).join('')}
  <!-- door of 4F -->
  <rect x="80" y="230" width="230" height="440" rx="6" fill="#7b4b33"/>
  <rect x="100" y="250" width="190" height="400" rx="4" fill="#8c5a3d"/>
  <circle cx="270" cy="460" r="9" fill="#d9b25f"/>
  <rect x="160" y="300" width="70" height="40" rx="4" fill="#efe2c4"/><text x="195" y="328" font-size="22" text-anchor="middle" fill="#7b4b33">402</text>
  <!-- bulb -->
  <line x1="700" y1="0" x2="700" y2="110" stroke="#3a3027" stroke-width="3"/>
  <circle cx="700" cy="125" r="18" fill="${lamps ? '#fff0c4' : '#e9e2cf'}"/>
  ${lampGlow(700, 140, 300, lamps)}`;
}

const ROOMS = { living, kitchen, rooftop, myroom, bookshop, stairs };
export const ROOM_IDS = Object.keys(ROOMS);

export function renderScene(room, time = 'day', weather = 'clear') {
  const T = TIMES[time] || TIMES.day;
  const draw = ROOMS[room] || ROOMS.living;
  GLOWS = [];
  const body = draw(time, weather);
  const rainDim = weather === 'rain' ? `<rect width="${W}" height="${H}" fill="#3c4a5e" opacity="${time === 'night' ? 0.18 : 0.22}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${room}">
  ${defs(time, weather)}
  ${body}
  <rect width="${W}" height="${H}" fill="${T.tint}" opacity="${T.tintA}" style="mix-blend-mode:multiply"/>
  ${rainDim}
  ${GLOWS.join('')}
  <rect width="${W}" height="${H}" filter="url(#paper)"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;
}
