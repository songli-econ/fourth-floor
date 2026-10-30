import test from 'node:test';
import assert from 'node:assert/strict';
import { chapter1 } from '../story/chapter1.js';
import { CHARACTERS } from '../story/bible.js';
import { newState } from '../src/state.js';
import { nextUp, markDayIfComplete } from '../src/calendar.js';
import { playScene } from './helpers.mjs';

const SPEAKERS = new Set([...Object.keys(CHARACTERS), 'me']);
const FACES = new Set(['normal', 'smile', 'sad', 'surprised']);
const BGS = new Set(['living', 'kitchen', 'rooftop', 'myroom', 'bookshop', 'stairs']);
const TIMES = new Set(['dawn', 'day', 'dusk', 'night']);
const WEATHER = new Set([undefined, 'clear', 'rain']);

function walk(steps, fn) {
  for (const s of steps || []) {
    fn(s);
    walk(s.then, fn); walk(s.else, fn);
    for (const o of s.choice || []) { fn(o); walk(o.then, fn); }
  }
}

function collectCondFlags(cond, out) {
  if (!cond || typeof cond !== 'object') return;
  if (cond.flag) out.add(cond.flag);
  for (const k of ['all', 'any']) for (const c of cond[k] || []) collectCondFlags(c, out);
  if (cond.not) collectCondFlags(cond.not, out);
}

test('scene ids are unique and every day has scenes', () => {
  const ids = chapter1.scenes.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (let d = 0; d <= chapter1.lastDay; d++) assert.ok(chapter1.scenes.some(s => s.day === d), `day ${d} empty`);
});

test('speakers, faces, backgrounds are all known', () => {
  for (const sc of chapter1.scenes) {
    assert.ok(BGS.has(sc.bg), `${sc.id} bg ${sc.bg}`);
    assert.ok(TIMES.has(sc.time), `${sc.id} time ${sc.time}`);
    assert.ok(WEATHER.has(sc.weather), `${sc.id} weather ${sc.weather}`);
    walk(sc.steps, s => {
      if ('say' in s) { assert.ok(SPEAKERS.has(s.say), `${sc.id}: speaker ${s.say}`); assert.ok(FACES.has(s.face), `${sc.id}: face ${s.face}`); }
      if ('note' in s) assert.ok(SPEAKERS.has(s.note), `${sc.id}: note from ${s.note}`);
      if (s.bg) { assert.ok(BGS.has(s.bg), `${sc.id}: bg ${s.bg}`); assert.ok(!s.time || TIMES.has(s.time)); }
      if (s.show) for (const id of s.show) assert.ok(CHARACTERS[id], `${sc.id}: show ${id}`);
      if ('text' in s && typeof s.text === 'string') assert.ok(s.text.trim().length > 0, `${sc.id}: empty line`);
      if (s.choice) assert.ok(s.choice.length >= 2, `${sc.id}: choice with <2 options`);
    });
  }
});

test('every flag tested somewhere is set somewhere', () => {
  const set = new Set(), tested = new Set();
  const visit = s => {
    for (const f of [].concat(s.set || [])) set.add(f);
    collectCondFlags(s.if, tested);
  };
  for (const sc of chapter1.scenes) { visit(sc); walk(sc.steps, visit); }
  for (const f of tested) assert.ok(set.has(f), `flag ${f} is tested but never set`);
});

test('every option of every choice plays through without error', () => {
  for (const sc of chapter1.scenes) {
    // Explore each choice position with each option, others default to first.
    let maxChoices = 0;
    playScene(sc, newState('甲'), () => { maxChoices++; return 0; });
    for (let pos = 1; pos <= Math.max(1, maxChoices); pos++) {
      for (let pick = 0; pick < 4; pick++) {
        let n = 0;
        const ev = playScene(sc, newState('甲'), e => { n++; return n === pos ? Math.min(pick, e.options.length - 1) : 0; });
        assert.equal(ev.at(-1).type, 'end', `${sc.id} pos ${pos} pick ${pick}`);
        for (const e of ev) if (e.text !== undefined) assert.ok(!/\{(name|m:)/.test(e.text), `${sc.id}: unresolved template in ${e.text}`);
      }
    }
  }
});

test('the whole chapter plays from day 0 to the end in free pace', () => {
  for (const seed of [0, 1, 2, 3, 4, 5, 6, 7]) {
    const s = newState(); s.settings.pace = 'free';
    let guard = 0, k = seed;
    for (;;) {
      const up = nextUp(chapter1, s, '2026-10-29');
      if (up.status === 'end') break;
      assert.equal(up.status, 'play');
      playScene(up.scene, s, e => (k = (k * 7 + 3) % 11) % e.options.length);
      markDayIfComplete(chapter1, s, up.day, '2026-10-29');
      assert.ok(++guard < 500);
    }
    assert.equal(Object.keys(s.done).length, chapter1.scenes.length);
  }
});

test('each of the four endings is reachable and names its own character', async () => {
  const { closest } = await import('../story/ch1/d12-14.js');
  const ending = chapter1.scenes.find(s => s.id === 'd14-night');
  for (const id of ['ache', 'xiaoman', 'laozhou', 'nico']) {
    const s = newState('甲');
    s.aff[id] = 10;
    assert.equal(closest(s), id);
    const ev = playScene(ending, s);
    const shown = ev.filter(e => e.type === 'show' && e.show.length === 1).map(e => e.show[0]);
    assert.ok(shown.includes(id), `ending for ${id} shows ${shown}`);
    assert.ok(ev.some(e => e.type === 'say' && e.who === id), `ending for ${id} has their lines`);
  }
});

test('memory set early is used later', () => {
  const s = newState('甲'); s.settings.pace = 'free';
  s.mem.cilantro = 'no';
  const d2 = chapter1.scenes.find(x => x.id === 'd2-morning');
  const ev = playScene(d2, s);
  assert.ok(ev.some(e => e.text === '便利贴最下面有一行小字：「没放香菜。」'));
});
