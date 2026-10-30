import test from 'node:test';
import assert from 'node:assert/strict';
import { nextUp, markDayIfComplete, absence, daysBetween, dateKey } from '../src/calendar.js';
import { newState, save, load, exportSave, importSave, SAVE_KEY } from '../src/state.js';

const chapter = {
  lastDay: 2,
  scenes: [
    { id: 'a', day: 0, steps: [] }, { id: 'b', day: 1, steps: [] },
    { id: 'c', day: 1, steps: [] }, { id: 'd', day: 2, steps: [] }
  ]
};

function memStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m };
}

test('dates', () => {
  assert.equal(daysBetween('2026-10-29', '2026-11-02'), 4);
  assert.equal(daysBetween('2026-12-31', '2027-01-01'), 1);
  assert.match(dateKey(new Date(2026, 0, 5)), /^2026-01-05$/);
});

test('real pace: next day waits until tomorrow', () => {
  const s = newState();
  assert.equal(nextUp(chapter, s, '2026-10-29').scene.id, 'a');
  s.done.a = true;
  markDayIfComplete(chapter, s, 0, '2026-10-29');
  assert.deepEqual(nextUp(chapter, s, '2026-10-29'), { status: 'wait', day: 1 });
  const n = nextUp(chapter, s, '2026-10-30');
  assert.equal(n.status, 'play'); assert.equal(n.scene.id, 'b');
});

test('within a day scenes run in order; free pace never waits', () => {
  const s = newState();
  s.settings.pace = 'free';
  s.done.a = true; markDayIfComplete(chapter, s, 0, '2026-10-29');
  assert.equal(nextUp(chapter, s, '2026-10-29').scene.id, 'b');
  s.done.b = true;
  assert.equal(nextUp(chapter, s, '2026-10-29').scene.id, 'c');
  s.done.c = true; s.done.d = true;
  assert.equal(nextUp(chapter, s, '2026-10-29').status, 'end');
});

test('long absence does not skip story or punish', () => {
  const s = newState();
  s.done.a = true; markDayIfComplete(chapter, s, 0, '2026-10-01');
  s.lastVisit = '2026-10-01';
  assert.equal(absence(s, '2026-10-29'), 28);
  assert.equal(nextUp(chapter, s, '2026-10-29').scene.id, 'b');
});

test('save/load round trip keeps settings apart', () => {
  const st = memStorage();
  const s = newState('林');
  s.flags.x = true; s.settings.llm.key = 'sk-secret';
  assert.ok(save(st, s));
  assert.ok(!st.m.get(SAVE_KEY).includes('sk-secret'));
  const back = load(st);
  assert.equal(back.name, '林'); assert.ok(back.flags.x);
  assert.equal(back.settings.llm.key, 'sk-secret');
});

test('export never carries the API key; import validates', () => {
  const s = newState('林');
  s.settings.llm.key = 'sk-secret'; s.mem.book = '旧诗集';
  const text = exportSave(s);
  assert.ok(!text.includes('sk-secret'));
  const back = importSave(text, s.settings);
  assert.equal(back.mem.book, '旧诗集');
  assert.equal(back.settings.llm.key, 'sk-secret');
  assert.throws(() => importSave('{"kind":"other"}'));
});

test('broken storage does not crash', () => {
  const bad = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() {} };
  const s = load(bad);
  assert.equal(s.v, 1);
  assert.equal(save(bad, s), false);
});
