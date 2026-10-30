// Half-body portraits, 400x560 SVG. Faces: normal, smile, sad, surprised.

export const FACES = ['normal', 'smile', 'sad', 'surprised'];

const LOOK = {
  ache: {
    skin: '#f3d5bd', shade: '#e4b99c', hair: '#262b3a', hairHi: '#3b4256', eye: '#2b2b33', blush: 0.18, eyeScale: 0.85,
    back: `<path d="M108 196 Q 100 86 200 82 Q 300 86 292 196 L 296 300 Q 262 314 246 284 L 154 284 Q 138 314 104 300 Z"/>`,
    front: `<path d="M118 196 Q 118 98 200 92 Q 288 96 286 188 Q 262 150 214 140 Q 196 168 150 176 Q 132 190 126 214 Z"/>`,
    body: `<path d="M50 560 Q 58 380 200 346 Q 342 380 350 560 Z" fill="#8a929c"/>
           <path d="M150 352 L 200 420 L 250 352 L 232 344 L 200 386 L 168 344 Z" fill="#f2f0ea"/>
           <path d="M138 360 L 200 470 L 262 360" stroke="#71798a" stroke-width="5" fill="none"/>
           <path d="M164 350 Q 180 470 236 520" stroke="#4f7fb2" stroke-width="4" fill="none"/>
           <rect x="218" y="510" width="44" height="34" rx="5" fill="#f7f5ef" stroke="#4f7fb2" stroke-width="3"/>
           <rect x="225" y="518" width="16" height="16" fill="#9ab6d8"/>`
  },
  xiaoman: {
    skin: '#f6dcc4', shade: '#ebbf9f', hair: '#9e4f33', hairHi: '#c26a45', eye: '#4a2a1e', blush: 0.36, eyeScale: 1.08,
    back: `<path d="M116 200 Q 112 92 200 88 Q 288 92 284 200 L 280 262 Q 250 272 240 250 L 160 250 Q 150 272 120 262 Z"/>
           <circle cx="236" cy="86" r="40"/><circle cx="214" cy="70" r="22"/>`,
    front: `<path d="M120 200 Q 118 104 200 98 Q 282 102 282 196 L 268 168 L 256 186 L 244 150 L 226 178 L 214 146 L 196 176 L 182 144 L 166 182 L 150 152 L 138 192 Z"/>`,
    extra: `<line x1="200" y1="58" x2="278" y2="108" stroke="#e6c35b" stroke-width="7" stroke-linecap="round"/>
            <path d="M272 104 l 12 8 l -4 4 z" fill="#3a3027"/>
            <ellipse cx="248" cy="238" rx="9" ry="5" fill="#5f8fc4" opacity="0.75" transform="rotate(-20 248 238)"/>`,
    body: `<path d="M50 560 Q 60 384 200 352 Q 340 384 350 560 Z" fill="#f4f1ea"/>
           <path d="M110 560 L 128 432 L 272 432 L 290 560 Z" fill="#d9a441"/>
           <rect x="132" y="370" width="22" height="80" fill="#d9a441" transform="rotate(-8 143 410)"/>
           <rect x="246" y="370" width="22" height="80" fill="#d9a441" transform="rotate(8 257 410)"/>
           <circle cx="150" cy="440" r="8" fill="#7a6a4f"/><circle cx="250" cy="440" r="8" fill="#7a6a4f"/>
           <rect x="172" y="470" width="56" height="44" rx="4" fill="#c99234"/>
           <circle cx="160" cy="500" r="6" fill="#5f8fc4"/><circle cx="246" cy="528" r="5" fill="#d2584a"/><circle cx="90" cy="470" r="5" fill="#6aa65a"/>`
  },
  laozhou: {
    skin: '#ebc7a4', shade: '#d6a982', hair: '#b8b2a8', hairHi: '#d4cfc6', eye: '#3d2f24', blush: 0.14, eyeScale: 0.8,
    back: `<path d="M114 210 Q 108 130 150 108 L 170 140 Q 136 160 138 220 Z"/><path d="M286 210 Q 292 130 250 108 L 230 140 Q 264 160 262 220 Z"/>
           <path d="M150 108 Q 200 84 250 108 L 238 118 Q 200 104 162 118 Z"/>`,
    front: `<path d="M124 214 Q 120 150 150 124 L 156 150 Q 136 170 136 222 Z"/><path d="M276 214 Q 280 150 250 124 L 244 150 Q 264 170 264 222 Z"/>`,
    extra: `<g fill="none" stroke="#5a4a3a" stroke-width="4"><circle cx="168" cy="208" r="24"/><circle cx="232" cy="208" r="24"/><path d="M192 206 Q 200 200 208 206"/><path d="M144 204 L 124 198"/><path d="M256 204 L 276 198"/></g>
            <g stroke="#c49a76" stroke-width="2" fill="none" opacity="0.8"><path d="M142 222 q -6 6 -4 12"/><path d="M258 222 q 6 6 4 12"/><path d="M176 158 q 24 -6 48 0"/></g>
            <path d="M178 266 Q 200 276 222 266" stroke="#9a8e80" stroke-width="5" fill="none" opacity="0.55"/>`,
    body: `<path d="M50 560 Q 56 384 200 350 Q 344 384 350 560 Z" fill="#8a6a4a"/>
           <path d="M164 352 L 200 404 L 236 352 Z" fill="#ece4d3"/>
           <path d="M174 354 L 200 420 L 200 560" stroke="#6f5338" stroke-width="5" fill="none"/>
           ${[440, 480, 520].map(y => `<circle cx="212" cy="${y}" r="6" fill="#d9c09a"/>`).join('')}
           <path d="M80 470 l 50 -10 v 50 l -50 6 z" fill="#7a5c3f"/>`
  },
  nico: {
    skin: '#ddae86', shade: '#c9946a', hair: '#3e2a20', hairHi: '#5a3e2e', eye: '#3a2a1a', blush: 0.2, eyeScale: 1,
    back: `<path d="M116 210 Q 110 110 200 100 Q 290 110 284 210 L 282 250 Q 250 250 240 236 L 160 236 Q 150 250 118 250 Z"/>`,
    front: [
      [130, 150, 30], [160, 118, 32], [200, 104, 34], [240, 116, 32], [272, 148, 30],
      [146, 132, 22], [186, 96, 22], [224, 98, 24], [258, 124, 22], [124, 186, 20], [278, 184, 20]
    ].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join(''),
    extra: `<g fill="#a5704c" opacity="0.6">${[[160, 236], [170, 242], [152, 244], [240, 236], [230, 242], [248, 244], [200, 230]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join('')}</g>`,
    body: `<path d="M44 560 Q 54 380 200 346 Q 346 380 356 560 Z" fill="#6a9a6e"/>
           <path d="M156 350 Q 200 384 244 350" stroke="#57835b" stroke-width="12" fill="none"/>
           ${[400, 440, 480, 520].map(y => `<path d="M70 ${y} Q 200 ${y + 14} 330 ${y}" stroke="#7caa80" stroke-width="3" fill="none" opacity="0.6"/>`).join('')}
           <rect x="250" y="460" width="40" height="54" rx="4" fill="#e8dcc0" transform="rotate(10 270 487)"/>`
  }
};

function eyes(face, L) {
  const s = L.eyeScale;
  const col = L.eye;
  const one = (x, mirror) => {
    switch (face) {
      case 'smile':
        return `<path d="M${x - 12} 210 Q ${x} ${198 - 2 * s} ${x + 12} 210" stroke="${col}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
      case 'sad':
        return `<ellipse cx="${x}" cy="213" rx="${8 * s}" ry="${9 * s}" fill="${col}"/><circle cx="${x + 3}" cy="209" r="2.6" fill="#fff"/>
                <path d="M${x - 13} ${mirror ? 202 : 206} L ${x + 13} ${mirror ? 206 : 202}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;
      case 'surprised':
        return `<ellipse cx="${x}" cy="206" rx="${11 * s}" ry="${14 * s}" fill="#fff" stroke="${col}" stroke-width="3"/><circle cx="${x}" cy="207" r="${5.5 * s}" fill="${col}"/><circle cx="${x + 2}" cy="204" r="2" fill="#fff"/>`;
      default:
        return `<ellipse cx="${x}" cy="208" rx="${9 * s}" ry="${12 * s}" fill="${col}"/><circle cx="${x + 3}" cy="203" r="3.4" fill="#fff"/><circle cx="${x - 3}" cy="213" r="1.6" fill="#fff" opacity="0.7"/>
                <path d="M${x - 13} 199 Q ${x} ${192} ${x + 13} 199" stroke="${col}" stroke-width="3.5" stroke-linecap="round" fill="none"/>`;
    }
  };
  return one(168, false) + one(232, true);
}

function brows(face, L) {
  const c = L.hair === '#b8b2a8' ? '#8e877c' : L.hair;
  switch (face) {
    case 'smile': return `<path d="M152 180 Q 168 170 184 178" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M216 178 Q 232 170 248 180" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    case 'sad': return `<path d="M152 184 L 184 174" stroke="${c}" stroke-width="5" stroke-linecap="round"/><path d="M216 174 L 248 184" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
    case 'surprised': return `<path d="M150 172 Q 168 158 186 168" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M214 168 Q 232 158 250 172" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    default: return `<path d="M152 182 Q 168 176 184 180" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M216 180 Q 232 176 248 182" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  }
}

function mouth(face) {
  switch (face) {
    case 'smile': return `<path d="M182 250 Q 200 270 218 250 Q 200 260 182 250 Z" fill="#b5524a"/><path d="M186 252 Q 200 258 214 252" stroke="#fff" stroke-width="3" fill="none" opacity="0.8"/>`;
    case 'sad': return `<path d="M188 260 Q 200 250 212 260" stroke="#9a4a42" stroke-width="4" stroke-linecap="round" fill="none"/>`;
    case 'surprised': return `<ellipse cx="200" cy="258" rx="8" ry="10" fill="#9a3f3a"/>`;
    default: return `<path d="M188 254 Q 200 260 212 254" stroke="#9a4a42" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  }
}

function person(id, face) {
  const L = LOOK[id];
  return `
  <g fill="${L.hair}">${L.back}</g>
  ${L.body}
  <path d="M176 270 L 176 352 Q 200 366 224 352 L 224 270 Z" fill="${L.shade}"/>
  <ellipse cx="122" cy="214" rx="12" ry="18" fill="${L.shade}"/><ellipse cx="278" cy="214" rx="12" ry="18" fill="${L.shade}"/>
  <path d="M122 186 Q 122 292 200 296 Q 278 292 278 186 Q 278 104 200 104 Q 122 104 122 186 Z" fill="${L.skin}"/>
  <ellipse cx="160" cy="236" rx="18" ry="9" fill="#f08a7a" opacity="${face === 'smile' ? L.blush + 0.12 : L.blush}"/>
  <ellipse cx="240" cy="236" rx="18" ry="9" fill="#f08a7a" opacity="${face === 'smile' ? L.blush + 0.12 : L.blush}"/>
  <path d="M198 222 Q 194 236 202 238" stroke="${L.shade}" stroke-width="3" fill="none"/>
  ${eyes(face, L)}${brows(face, L)}${mouth(face)}
  <g fill="${L.hair}">${L.front}</g>
  ${L.extra || ''}`;
}

function cat(face) {
  const eye = {
    normal: `<ellipse cx="170" cy="300" rx="11" ry="14" fill="#7a9a3a"/><ellipse cx="170" cy="300" rx="3" ry="11" fill="#1f1a14"/><ellipse cx="230" cy="300" rx="11" ry="14" fill="#7a9a3a"/><ellipse cx="230" cy="300" rx="3" ry="11" fill="#1f1a14"/>`,
    smile: `<path d="M158 302 Q 170 290 182 302" stroke="#3a2a1a" stroke-width="4" fill="none"/><path d="M218 302 Q 230 290 242 302" stroke="#3a2a1a" stroke-width="4" fill="none"/>`,
    sad: `<path d="M158 298 L 182 304" stroke="#3a2a1a" stroke-width="4"/><path d="M218 304 L 242 298" stroke="#3a2a1a" stroke-width="4"/>`,
    surprised: `<circle cx="170" cy="300" r="14" fill="#7a9a3a"/><circle cx="170" cy="300" r="8" fill="#1f1a14"/><circle cx="230" cy="300" r="14" fill="#7a9a3a"/><circle cx="230" cy="300" r="8" fill="#1f1a14"/>`
  }[face] || '';
  return `
  <path d="M90 560 Q 70 420 140 380 L 260 380 Q 330 420 310 560 Z" fill="#e6a35e"/>
  <path d="M150 560 Q 160 440 200 420 Q 240 440 250 560 Z" fill="#fbf4e8"/>
  <path d="M300 540 Q 380 500 350 420 Q 340 400 330 420 Q 350 490 290 520 Z" fill="#e6a35e"/>
  <ellipse cx="200" cy="300" rx="96" ry="82" fill="#e6a35e"/>
  <path d="M116 260 L 120 180 L 170 236 Z" fill="#e6a35e"/><path d="M284 260 L 280 180 L 230 236 Z" fill="#e6a35e"/>
  <path d="M126 246 L 128 200 L 156 232 Z" fill="#f2b8a8"/><path d="M274 246 L 272 200 L 244 232 Z" fill="#f2b8a8"/>
  <path d="M150 330 Q 200 300 250 330 Q 240 382 200 384 Q 160 382 150 330 Z" fill="#fbf4e8"/>
  <path d="M170 236 l 10 26 M200 228 v 30 M230 236 l -10 26" stroke="#c97f3e" stroke-width="6" stroke-linecap="round"/>
  ${eye}
  <path d="M194 324 h12 l -6 8 z" fill="#d97a7a"/>
  <path d="M200 332 q -8 10 -16 6 M200 332 q 8 10 16 6" stroke="#6a4a3a" stroke-width="2.5" fill="none"/>
  <g stroke="#fff" stroke-width="1.6" opacity="0.8"><path d="M150 330 L 104 320"/><path d="M150 338 L 106 344"/><path d="M250 330 L 296 320"/><path d="M250 338 L 294 344"/></g>`;
}

export function renderPortrait(id, face = 'normal') {
  const f = FACES.includes(face) ? face : 'normal';
  const inner = id === 'cat' ? cat(f) : LOOK[id] ? person(id, f) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" class="portrait-svg" aria-hidden="true">${inner}</svg>`;
}

export const PORTRAIT_IDS = ['ache', 'xiaoman', 'laozhou', 'nico', 'cat'];
