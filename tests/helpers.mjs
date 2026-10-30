import { runScene } from '../src/engine.js';

// Drive a scene to the end, picking options with `pick(event, i)` (default: first).
export function playScene(scene, state, pick = () => 0, input = () => '测试') {
  const gen = runScene(scene, state);
  const events = [];
  let r = gen.next();
  while (!r.done) {
    const ev = r.value;
    events.push(ev);
    if (ev.type === 'choice') r = gen.next(pick(ev, events.length));
    else if (ev.type === 'input') r = gen.next(input(ev));
    else r = gen.next();
  }
  return events;
}
