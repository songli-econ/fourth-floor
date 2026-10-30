// Ambient sound synthesized on the fly: rain (filtered noise) and a soft room tone.
// Nothing plays until the player turns sound on.

let ctx = null, rainGain = null, roomGain = null, master = null;

function noiseBuffer(c, seconds = 2) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;      // brown-ish
    d[i] = last * 3.5;
  }
  return buf;
}

function ensure() {
  if (ctx) return ctx;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.0; master.connect(ctx.destination);

  const rain = ctx.createBufferSource(); rain.buffer = noiseBuffer(ctx, 3); rain.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000;
  rainGain = ctx.createGain(); rainGain.gain.value = 0;
  rain.connect(hp).connect(lp).connect(rainGain).connect(master); rain.start();

  const room = ctx.createBufferSource(); room.buffer = noiseBuffer(ctx, 4); room.loop = true;
  const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 260;
  roomGain = ctx.createGain(); roomGain.gain.value = 0.25;
  room.connect(lp2).connect(roomGain).connect(master); room.start();
  return ctx;
}

export function setSound(on) {
  const c = ensure();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  master.gain.setTargetAtTime(on ? 0.55 : 0, c.currentTime, 0.6);
}

export function setRain(on) {
  if (!ctx) return;
  rainGain.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 1.2);
}

// A tiny two-note chime for page turns and notes.
export function chime() {
  if (!ctx || master.gain.value < 0.01) return;
  const t = ctx.currentTime;
  for (const [f, dt] of [[880, 0], [1320, 0.09]]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t + dt); g.gain.linearRampToValueAtTime(0.08, t + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.8);
    o.connect(g).connect(master); o.start(t + dt); o.stop(t + dt + 0.9);
  }
}
