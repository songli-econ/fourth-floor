import test from 'node:test';
import assert from 'node:assert/strict';
import { runSteps, evalCond, renderText, applyEffects, AFF_MAX } from '../src/engine.js';
import { newState } from '../src/state.js';
import { playScene } from './helpers.mjs';

function drive(steps, state, picks = []) {
  const gen = runSteps(steps, state);
  const out = [];
  let r = gen.next();
  while (!r.done) {
    out.push(r.value);
    r = r.value.type === 'choice' ? gen.next(picks.shift() ?? 0) : r.value.type === 'input' ? gen.next('小林') : gen.next();
  }
  return out;
}

test('choice applies option effects and runs its branch', () => {
  const s = newState();
  const steps = [{ choice: [
    { text: 'a', aff: { ache: 2 }, set: 'x', then: [{ text: 'A' }] },
    { text: 'b', mem: { k: 'v' }, then: [{ text: 'B' }] }
  ] }];
  const ev = drive(steps, s, [1]);
  assert.deepEqual(ev.map(e => e.type), ['choice', 'text']);
  assert.equal(ev[1].text, 'B');
  assert.equal(s.mem.k, 'v');
  assert.equal(s.aff.ache, 0);
  assert.equal(s.flags.x, undefined);
});

test('if/then/else branches and conditional steps', () => {
  const s = newState();
  s.flags.f = true;
  const ev = drive([
    { if: { flag: 'f' }, then: [{ text: 'yes' }], else: [{ text: 'no' }] },
    { if: { flag: 'g' }, text: 'hidden' },
    { if: { not: { flag: 'g' } }, text: 'shown' }
  ], s);
  assert.deepEqual(ev.map(e => e.text), ['yes', 'shown']);
});

test('options filtered by condition', () => {
  const s = newState();
  const ev = drive([{ choice: [{ text: 'a', if: { flag: 'nope' } }, { text: 'b', then: [{ text: 'B' }] }] }], s, [0]);
  assert.deepEqual(ev[0].options, ['b']);
  assert.equal(ev[1].text, 'B');
});

test('conditions', () => {
  const s = newState();
  s.aff.nico = 3; s.mem.c = 'no'; s.done.x = true;
  assert.ok(evalCond({ aff: ['nico', '>=', 3] }, s));
  assert.ok(!evalCond({ aff: ['nico', '>', 3] }, s));
  assert.ok(evalCond({ memIs: ['c', 'no'] }, s));
  assert.ok(evalCond({ all: [{ seen: 'x' }, { mem: 'c' }] }, s));
  assert.ok(evalCond({ any: [{ flag: 'q' }, { seen: 'x' }] }, s));
  assert.throws(() => evalCond({ weird: 1 }, s));
});

test('affinity is clamped', () => {
  const s = newState();
  applyEffects({ aff: { ache: 999 } }, s);
  assert.equal(s.aff.ache, AFF_MAX);
});

test('text templates', () => {
  const s = newState('阿林');
  s.mem.book = '旧诗集';
  assert.equal(renderText('{name}借了{m:book}', s), '阿林借了旧诗集');
  assert.equal(renderText(st => st.name + '!', s), '阿林!');
  assert.equal(renderText('{name}', newState()), '你');
});

test('input step sets the name', () => {
  const s = newState();
  drive([{ input: 'name', prompt: 'p' }, { say: 'laozhou', text: '{name}好' }], s);
  assert.equal(s.name, '小林');
});

test('runScene marks the scene done and emits scene/end', () => {
  const s = newState();
  const ev = playScene({ id: 'z', steps: [{ text: 'hi' }], set: 'after' }, s);
  assert.equal(ev[0].type, 'scene');
  assert.equal(ev.at(-1).type, 'end');
  assert.ok(s.done.z);
  assert.ok(s.flags.after);
});
