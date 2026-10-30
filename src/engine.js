// Scene runner. A scene is a list of steps; the runner is a generator that yields only
// the events the UI must show, and applies state changes (flags, affinity, memory) inline.
//
// Step forms:
//   { text }                       narration
//   { say, face?, text }           a character line
//   { note, from?, text }          a sticky note / message card
//   { bg, time?, weather? }        change background
//   { show: [ids] }                who is on stage (portraits)
//   { choice: [{ text, then?, set?, aff?, mem?, if? }] }
//   { if: cond, then: [...], else?: [...] }
//   { set?, unset?, aff?, mem? }   pure state change
//   { pause: ms }                  a beat with no text
//   { input: key, prompt, fallback } ask the player for a short text ('name' sets state.name)

export const AFF_MIN = -5;
export const AFF_MAX = 20;

export function evalCond(cond, state) {
  if (!cond) return true;
  if (typeof cond === 'function') return !!cond(state);
  if (cond.all) return cond.all.every(c => evalCond(c, state));
  if (cond.any) return cond.any.some(c => evalCond(c, state));
  if (cond.not) return !evalCond(cond.not, state);
  if ('flag' in cond) return !!state.flags[cond.flag];
  if ('mem' in cond) return state.mem[cond.mem] !== undefined;
  if ('memIs' in cond) return state.mem[cond.memIs[0]] === cond.memIs[1];
  if ('seen' in cond) return !!state.done[cond.seen];
  if ('aff' in cond) {
    const [who, op, n] = cond.aff;
    const v = state.aff[who] ?? 0;
    switch (op) {
      case '>=': return v >= n;
      case '>': return v > n;
      case '<=': return v <= n;
      case '<': return v < n;
      case '==': return v === n;
      default: throw new Error(`unknown aff op ${op}`);
    }
  }
  throw new Error(`unknown condition ${JSON.stringify(cond)}`);
}

export function applyEffects(step, state) {
  if (step.set) for (const k of [].concat(step.set)) state.flags[k] = true;
  if (step.unset) for (const k of [].concat(step.unset)) delete state.flags[k];
  if (step.aff) {
    for (const [who, d] of Object.entries(step.aff)) {
      const v = (state.aff[who] ?? 0) + d;
      state.aff[who] = Math.max(AFF_MIN, Math.min(AFF_MAX, v));
    }
  }
  if (step.mem) Object.assign(state.mem, step.mem);
}

export function renderText(text, state) {
  const raw = typeof text === 'function' ? text(state) : text;
  return String(raw)
    .replace(/\{name\}/g, state.name || '你')
    .replace(/\{m:([a-zA-Z0-9_]+)\}/g, (_, k) => (state.mem[k] ?? ''));
}

export function* runSteps(steps, state) {
  for (const step of steps) {
    if (step.if !== undefined) {
      if (step.then || step.else) {
        yield* runSteps(evalCond(step.if, state) ? (step.then || []) : (step.else || []), state);
        continue;
      }
      if (!evalCond(step.if, state)) continue;
    }
    applyEffects(step, state);
    if (step.bg) yield { type: 'bg', bg: step.bg, time: step.time, weather: step.weather };
    if (step.show) yield { type: 'show', show: step.show };
    if (step.pause) yield { type: 'pause', ms: step.pause };
    if ('note' in step) {
      yield { type: 'note', from: step.from || step.note, text: renderText(step.text, state) };
    } else if ('say' in step) {
      yield { type: 'say', who: step.say, face: step.face || 'normal', text: renderText(step.text, state) };
    } else if ('text' in step) {
      yield { type: 'text', text: renderText(step.text, state) };
    }
    if (step.input) {
      const value = yield { type: 'input', key: step.input, prompt: renderText(step.prompt || '', state), placeholder: step.placeholder || '' };
      const clean = String(value ?? '').trim().slice(0, 12) || step.fallback || '';
      if (step.input === 'name') state.name = clean;
      else state.mem[step.input] = clean;
    }
    if (step.choice) {
      const options = step.choice.filter(o => evalCond(o.if, state));
      const picked = yield { type: 'choice', options: options.map(o => renderText(o.text, state)) };
      const opt = options[picked ?? 0];
      if (!opt) throw new Error(`choice index ${picked} out of range`);
      applyEffects(opt, state);
      if (opt.then) yield* runSteps(opt.then, state);
    }
  }
}

// Run a whole scene. Effects declared on the scene itself apply when it ends.
export function* runScene(scene, state) {
  yield { type: 'scene', id: scene.id, title: scene.title, bg: scene.bg, time: scene.time, weather: scene.weather };
  yield* runSteps(scene.steps, state);
  applyEffects(scene, state);
  state.done[scene.id] = true;
  yield { type: 'end', id: scene.id };
}
