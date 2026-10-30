import { runScene, renderText, evalCond } from './engine.js';
import { nextUp, markDayIfComplete, absence, dateKey, partOfDay } from './calendar.js';
import { load, save, newState, exportSave, importSave, reset } from './state.js';
import { renderScene } from './art/scenes.js';
import { renderPortrait } from './art/portraits.js';
import { CHARACTERS, WORLD } from '../story/bible.js';
import { chapter1 } from '../story/chapter1.js';
import { IDLE, presentNow, welcomeBack } from '../story/idle.js';
import { PROVIDERS } from './llm/providers.js';
import * as llm from './llm/index.js';
import { setSound, setRain, chime } from './audio.js';

const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search);
const storage = (() => { try { return window.localStorage; } catch { return null; } })();
const today = () => params.get('today') || dateKey();
const realPart = () => params.get('part') || partOfDay();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TIME_LABEL = { dawn: '清晨', day: '白天', dusk: '傍晚', night: '深夜' };
const ROOM_LABEL = { living: '客厅', kitchen: '厨房', rooftop: '天台', myroom: '你的房间', bookshop: '楼下书店', stairs: '楼道' };
const dayLabel = d => (d === 0 ? '序章' : `第 ${d} 天`);

let state = load(storage);
const persist = () => save(storage, state);
const log = [];
let mode = 'title';          // title | story | hub | chat
let current = { room: 'living', time: 'dusk', weather: 'clear' };

// ───────────────────────── background & rain ─────────────────────────
const layers = [...document.querySelectorAll('#bg .bg-layer')];
let front = 0, bgKey = '';
function setBg(room, time, weather = 'clear') {
  current = { room, time, weather };
  const key = `${room}|${time}|${weather}`;
  if (key === bgKey) return;
  bgKey = key;
  const next = layers[1 - front];
  next.innerHTML = renderScene(room, time, weather);
  next.classList.add('on');
  layers[front].classList.remove('on');
  front = 1 - front;
  $('#rain').classList.toggle('on', weather === 'rain');
  setRain(weather === 'rain');
}
(function makeRain() {
  const box = $('#rain');
  for (let i = 0; i < 70; i++) {
    const d = document.createElement('i');
    d.style.left = `${Math.random() * 110}%`;
    d.style.animationDuration = `${0.55 + Math.random() * 0.5}s`;
    d.style.animationDelay = `${-Math.random() * 2}s`;
    d.style.opacity = `${0.3 + Math.random() * 0.6}`;
    box.appendChild(d);
  }
})();

// ───────────────────────── cast ─────────────────────────
const SLOTS = { 1: [50], 2: [32, 68], 3: [22, 50, 78], 4: [16, 38, 62, 84], 5: [12, 31, 50, 69, 88] };
let onStage = [];
function actorEl(id) { return document.querySelector(`.actor[data-id="${id}"]:not([data-leaving])`); }

function setCast(ids, { clickable = false } = {}) {
  const box = $('#cast');
  box.classList.toggle('hub', clickable);
  for (const el of [...box.children]) {
    if (!ids.includes(el.dataset.id) && !el.dataset.leaving) {
      el.dataset.leaving = '1';
      el.classList.remove('in');
      setTimeout(() => el.remove(), 500);
    }
  }
  onStage = ids.slice();
  const pos = SLOTS[ids.length] || SLOTS[5];
  ids.forEach((id, i) => {
    let el = document.querySelector(`.actor[data-id="${id}"]:not([data-leaving])`);
    if (!el) {
      for (const stale of document.querySelectorAll(`.actor[data-id="${id}"]`)) stale.remove();
      el = document.createElement('div');
      el.className = 'actor';
      el.dataset.id = id;
      el.dataset.face = 'normal';
      el.innerHTML = `<div class="breathe">${renderPortrait(id, 'normal')}</div><span class="tag">${CHARACTERS[id].name}</span>`;
      el.style.left = `${pos[i]}%`;
      box.appendChild(el);
      requestAnimationFrame(() => { if (!el.dataset.leaving) el.classList.add('in'); });
    }
    el.style.left = `${pos[i]}%`;
    el.classList.toggle('is-cat', id === 'cat');
    el.classList.toggle('clickable', clickable);
    el.classList.remove('speaking');
  });
}

function setFace(id, face) {
  for (const el of $('#cast').children) el.classList.toggle('speaking', el.dataset.id === id);
  const el = actorEl(id);
  if (el && el.dataset.face !== face) {
    el.dataset.face = face;
    el.querySelector('.breathe').innerHTML = renderPortrait(id, face);
  }
}

// ───────────────────────── waiting for the player ─────────────────────────
let waiter = null;          // { kind, resolve }
let typing = null;          // { finish }

function advance() {
  if (typing) { typing.finish(); return; }
  if (waiter && ['line', 'note', 'card'].includes(waiter.kind)) {
    const w = waiter; waiter = null; w.resolve();
  }
}
$('#dialog').addEventListener('click', advance);
$('#note').addEventListener('click', advance);
$('#card').addEventListener('click', advance);
document.addEventListener('keydown', e => {
  if (e.target instanceof Element && e.target.closest('input, select, textarea, dialog')) return;
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
  if (waiter?.kind === 'choice' && /^[1-9]$/.test(e.key)) $('#choices').children[Number(e.key) - 1]?.click();
});

function speakerName(who) {
  if (who === 'me') return state.name || '你';
  return CHARACTERS[who]?.name || '';
}

function typeText(el, text) {
  const speed = params.has('fast') ? 0 : state.settings.textSpeed;
  return new Promise(resolve => {
    if (!speed) { el.textContent = text; resolve(); return; }
    let i = 0;
    el.textContent = '';
    const timer = setInterval(() => {
      i++;
      el.textContent = text.slice(0, i);
      if (i >= text.length) done();
    }, speed);
    function done() { clearInterval(timer); el.textContent = text; typing = null; resolve(); }
    typing = { finish: done };
  });
}

async function showLine({ who, face = 'normal', text }) {
  const box = $('#dialog'), plate = $('#nameplate');
  box.hidden = false;
  box.classList.remove('ready');
  const narration = !who;
  box.classList.toggle('narration', narration);
  if (narration) {
    plate.textContent = '';
    for (const el of $('#cast').children) el.classList.remove('speaking');
  } else {
    plate.textContent = speakerName(who);
    plate.style.background = who === 'me' ? '#8a7a6a' : (CHARACTERS[who]?.color || '#8a7a6a');
    if (who !== 'me') {
      if (!onStage.includes(who)) setCast([...onStage, who].slice(-4));
      setFace(who, face);
    } else {
      for (const el of $('#cast').children) el.classList.remove('speaking');
    }
  }
  log.push({ who: narration ? '' : speakerName(who), text });
  if (log.length > 300) log.shift();
  await typeText($('#line'), text);
  box.classList.add('ready');
  await new Promise(resolve => { waiter = { kind: 'line', resolve }; });
}

function showChoices(options) {
  const box = $('#choices');
  box.innerHTML = '';
  box.hidden = false;
  return new Promise(resolve => {
    waiter = { kind: 'choice', resolve };
    options.forEach((text, i) => {
      const b = document.createElement('button');
      b.innerHTML = `<small>${i + 1}</small>`;
      b.append(text);
      b.style.animationDelay = `${i * 80}ms`;
      b.addEventListener('click', () => {
        box.hidden = true;
        waiter = null;
        log.push({ who: '→', text });
        resolve(i);
      });
      box.appendChild(b);
    });
    box.firstChild?.focus({ preventScroll: true });
  });
}

function askInput(prompt, placeholder) {
  const form = $('#ask'), input = $('#ask-input');
  $('#ask-label').textContent = prompt;
  input.placeholder = placeholder || '';
  input.value = '';
  form.hidden = false;
  $('#dialog').hidden = true;
  setTimeout(() => input.focus(), 50);
  return new Promise(resolve => {
    waiter = { kind: 'input', resolve };
    form.onsubmit = e => {
      e.preventDefault();
      form.hidden = true;
      waiter = null;
      resolve(input.value);
    };
  });
}

async function showNote(from, text) {
  $('#note-text').textContent = text;
  $('#note-from').textContent = from === 'me' ? '' : (CHARACTERS[from]?.name || '');
  $('#note').hidden = false;
  log.push({ who: `${CHARACTERS[from]?.name || ''}的字条`, text });
  chime();
  await new Promise(resolve => { waiter = { kind: 'note', resolve }; });
  $('#note').hidden = true;
}

async function showCard(sub, title, ms = 2600) {
  $('#card-sub').textContent = sub;
  $('#card-title').textContent = title;
  $('#card').hidden = false;
  $('#dialog').hidden = true;
  await Promise.race([
    new Promise(resolve => { waiter = { kind: 'card', resolve }; }),
    sleep(params.has('fast') ? 50 : ms)
  ]);
  waiter = null;
  $('#card').hidden = true;
}

let toastTimer;
function toast(text, ms = 2600) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), ms);
}

function setClock(day, time, weather) {
  $('#clock').textContent = `${dayLabel(day)} · ${TIME_LABEL[time] || ''}${weather === 'rain' ? ' · 雨' : ''}`;
}

// ───────────────────────── story ─────────────────────────
async function playScene(scene) {
  mode = 'story';
  $('#hub').hidden = true;
  $('#chatbox').hidden = true;
  $('#topbar').hidden = false;
  const gen = runScene(scene, state);
  let r = gen.next();
  while (!r.done) {
    const ev = r.value;
    let reply;
    switch (ev.type) {
      case 'scene':
        setBg(ev.bg, ev.time, ev.weather);
        setCast([]);
        setClock(scene.day, ev.time, ev.weather);
        await showCard(dayLabel(scene.day), ev.title);
        break;
      case 'bg':
        setBg(ev.bg, ev.time || current.time, ev.weather || current.weather);
        setClock(scene.day, ev.time || current.time, ev.weather || current.weather);
        await sleep(300);
        break;
      case 'show': setCast(ev.show); await sleep(200); break;
      case 'pause': await sleep(ev.ms); break;
      case 'text': await showLine({ text: ev.text }); break;
      case 'say': await showLine(ev); break;
      case 'note': $('#dialog').hidden = true; await showNote(ev.from, ev.text); break;
      case 'choice': reply = await showChoices(ev.options); break;
      case 'input': reply = await askInput(ev.prompt, ev.placeholder); break;
      default: break;
    }
    r = gen.next(reply);
  }
  state.lastVisit = today();
  if (!state.startedOn) state.startedOn = today();
  const finishedDay = markDayIfComplete(chapter1, state, scene.day, today());
  persist();
  $('#dialog').hidden = true;
  return finishedDay;
}

let storyRunning = false;
async function continueStory() {
  if (storyRunning) return;
  storyRunning = true;
  try { await storyLoop(); } finally { storyRunning = false; }
  enterHub();
}

async function storyLoop() {
  for (;;) {
    const up = nextUp(chapter1, state, today());
    if (up.status !== 'play') break;
    const finishedDay = await playScene(up.scene);
    if (finishedDay) {
      setCast([]);
      await showCard(dayLabel(up.day), up.day === chapter1.lastDay ? '第一章 · 完' : '今天就到这里', 3200);
      break;
    }
  }
}

// ───────────────────────── hub: the apartment right now ─────────────────────────
let welcomed = false;
function hubWeather() {
  const k = [...today()].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return k % 5 === 0 ? 'rain' : 'clear';
}

function enterHub() {
  mode = 'hub';
  for (const id of ['#dialog', '#choices', '#note', '#ask', '#chatbox']) $(id).hidden = true;
  $('#topbar').hidden = false;
  const part = realPart();
  const p = presentNow(part, state);
  const weather = hubWeather();
  setBg(p.room, part, weather);
  setCast(p.who, { clickable: true });
  const up = nextUp(chapter1, state, today());
  const day = up.day ?? chapter1.lastDay;
  $('#clock').textContent = `${today().slice(5).replace('-', '月')}日 · ${TIME_LABEL[part]}${weather === 'rain' ? ' · 雨' : ''}`;
  $('#hub-title').textContent = `四楼此刻 · ${ROOM_LABEL[p.room]}`;
  $('#hub-desc').textContent = WORLD.place[p.room].replace(/^[^：]+：/, '');
  const btn = $('#hub-story');
  if (up.status === 'play') {
    btn.hidden = false;
    btn.textContent = up.scene.id === 'd0-arrive' ? '开始：搬进来的那天' : `继续：${dayLabel(up.day)}`;
    $('#hub-hint').textContent = '点一下他们，可以聊几句。';
  } else if (up.status === 'wait') {
    btn.hidden = true;
    const h = 24 - new Date().getHours();
    $('#hub-hint').textContent = `${dayLabel(day)}的故事明天开始（大约 ${h} 小时后）。今晚他们都在，点一下就能聊。`;
  } else {
    btn.hidden = true;
    $('#hub-hint').textContent = '第一章到这里结束了。第二章还在写。你可以随时回来坐坐。';
  }
  $('#hub').hidden = false;
  const gap = absence(state, today());
  state.lastVisit = today();
  persist();
  if (!welcomed) {
    welcomed = true;
    const wb = welcomeBack(gap, state);
    if (wb) hubSay(wb.who, wb.face, renderText(wb.text, state));
  }
}

async function hubSay(who, face, text) {
  if (!onStage.includes(who)) setCast([...onStage, who].slice(-5), { clickable: true });
  await showLine({ who, face, text });
  $('#dialog').hidden = true;
  for (const el of $('#cast').children) el.classList.remove('speaking');
}

function idleLine(id) {
  const pool = (IDLE[id] || []).filter(l => evalCond(l.if, state));
  if (!pool.length) return { face: 'normal', text: '……' };
  const n = state.chats[id] || 0;
  state.chats[id] = n + 1;
  persist();
  const l = pool[n % pool.length];
  return { face: l.face || 'normal', text: renderText(l.text, state) };
}

let chatting = null;   // { id, history, busy }
$('#cast').addEventListener('click', async e => {
  const el = e.target.closest('.actor.clickable');
  if (!el || mode !== 'hub' || waiter) return;
  const id = el.dataset.id;
  const line = idleLine(id);
  if (id !== 'cat' && llm.isEnabled(state.settings)) {
    startChat(id, line);
  } else {
    await hubSay(id, line.face, line.text);
  }
});

async function startChat(id, opening) {
  mode = 'chat';
  $('#hub').hidden = true;
  chatting = { id, history: [{ role: 'assistant', content: opening.text }], busy: false };
  setFace(id, opening.face);
  showChatLine(id, opening.face, opening.text);
  $('#chatbox').hidden = false;
  $('#chat-input').value = '';
  $('#chat-input').focus();
}

function showChatLine(who, face, text) {
  const box = $('#dialog');
  box.hidden = false;
  box.classList.remove('narration');
  box.classList.add('ready');
  $('#nameplate').textContent = speakerName(who);
  $('#nameplate').style.background = CHARACTERS[who]?.color || '#8a7a6a';
  $('#line').textContent = text;
  if (who !== 'me') setFace(who, face);
  log.push({ who: speakerName(who), text });
}

$('#chatbox').addEventListener('submit', async e => {
  e.preventDefault();
  if (!chatting || chatting.busy) return;
  const text = $('#chat-input').value.trim();
  if (!text) return;
  $('#chat-input').value = '';
  chatting.history.push({ role: 'user', content: text });
  log.push({ who: speakerName('me'), text });
  chatting.busy = true;
  showChatLine(chatting.id, 'normal', '……');
  try {
    const titles = chapter1.scenes.filter(s => state.done[s.id]).map(s => s.title).slice(-8);
    const reply = await llm.chat({ id: chatting.id, state, history: chatting.history.slice(-12), sceneTitles: titles });
    chatting.history.push({ role: 'assistant', content: reply });
    showChatLine(chatting.id, /[哈笑！]/.test(reply) ? 'smile' : 'normal', reply);
  } catch (err) {
    toast(`没连上：${String(err.message || err).slice(0, 80)}`);
    const l = idleLine(chatting.id);
    showChatLine(chatting.id, l.face, l.text);
  } finally {
    if (chatting) chatting.busy = false;
  }
});
$('#chat-end').addEventListener('click', () => { chatting = null; enterHub(); });

$('#hub-story').addEventListener('click', () => { if (!waiter) continueStory(); });

// ───────────────────────── top bar, log, settings ─────────────────────────
$('#topbar').addEventListener('click', e => {
  const act = e.target.closest('button')?.dataset.act;
  if (act === 'hub' && mode === 'story') toast('先把这一段看完吧。');
  else if (act === 'hub') { chatting = null; enterHub(); }
  if (act === 'log') openLog();
  if (act === 'settings') openSettings();
});
for (const d of document.querySelectorAll('dialog')) {
  d.addEventListener('click', e => { if (e.target === d || e.target.matches('[data-close]')) d.close(); });
}

function openLog() {
  const ol = $('#log-list');
  ol.innerHTML = '';
  for (const { who, text } of log.slice(-120)) {
    const li = document.createElement('li');
    if (who) { const b = document.createElement('b'); b.textContent = who; li.append(b); }
    li.append(text);
    ol.append(li);
  }
  $('#log-modal').showModal();
  ol.lastElementChild?.scrollIntoView({ block: 'end' });
}

function openSettings() {
  const s = state.settings;
  for (const r of document.querySelectorAll('input[name=pace]')) r.checked = r.value === s.pace;
  $('#set-speed').value = 80 - s.textSpeed;
  $('#set-sound').checked = s.sound;
  const sel = $('#set-provider');
  if (!sel.options.length) for (const [id, p] of Object.entries(PROVIDERS)) sel.add(new Option(p.label, id));
  sel.value = s.llm.provider;
  fillProviderFields();
  $('#set-llm-on').checked = s.llm.enabled;
  $('#set-test-out').textContent = '';
  $('#settings-modal').showModal();
}

function fillProviderFields() {
  const s = state.settings.llm, p = PROVIDERS[$('#set-provider').value];
  $('#set-model').value = s.provider === $('#set-provider').value ? s.model : '';
  $('#set-model').placeholder = p.model || p.modelHint || '';
  $('#set-key').value = s.key;
  $('#set-endpoint').value = s.provider === $('#set-provider').value ? s.endpoint : '';
  $('#set-endpoint').placeholder = p.endpoint || '必填';
}

function readSettings() {
  const s = state.settings;
  s.pace = document.querySelector('input[name=pace]:checked')?.value || 'real';
  s.textSpeed = 80 - Number($('#set-speed').value);
  s.sound = $('#set-sound').checked;
  s.llm = {
    provider: $('#set-provider').value,
    model: $('#set-model').value.trim(),
    key: $('#set-key').value.trim(),
    endpoint: $('#set-endpoint').value.trim(),
    enabled: $('#set-llm-on').checked
  };
  setSound(s.sound);
  persist();
}
$('#settings-modal').addEventListener('change', e => {
  if (e.target.id === 'set-provider') fillProviderFields();
  readSettings();
});
$('#settings-modal').addEventListener('close', () => { if (mode === 'hub') enterHub(); });

$('#set-test').addEventListener('click', async () => {
  readSettings();
  const out = $('#set-test-out');
  out.textContent = '正在问阿澈……';
  try {
    const reply = await llm.chat({ id: 'ache', state: { ...state, settings: { ...state.settings, llm: { ...state.settings.llm, enabled: true } } }, history: [{ role: 'user', content: '你好，在吗？' }] });
    out.textContent = `阿澈：${reply}`;
  } catch (err) {
    out.textContent = `没连上：${String(err.message || err).slice(0, 160)}`;
  }
});

function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
$('#set-export').addEventListener('click', () => download(`四楼存档-${today()}.json`, exportSave(state)));
$('#set-import').addEventListener('click', () => $('#file-import').click());
$('#btn-import').addEventListener('click', () => $('#file-import').click());
$('#file-import').addEventListener('change', async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    state = importSave(await f.text(), state.settings);
    persist();
    toast('存档已导入。');
    $('#settings-modal').close();
    $('#title').hidden = true;
    enterHub();
  } catch (err) {
    toast(`导入失败：${err.message}`);
  }
});
let resetArmed = 0;
$('#set-reset').addEventListener('click', e => {
  if (Date.now() - resetArmed > 3000) {
    resetArmed = Date.now();
    e.target.textContent = '再点一次，确认重新开始';
    setTimeout(() => { e.target.textContent = '重新开始'; }, 3000);
    return;
  }
  const settings = state.settings;
  reset(storage);
  state = newState();
  state.settings = settings;
  persist();
  location.reload();
});

// ───────────────────────── title ─────────────────────────
function boot() {
  const part = realPart();
  setBg('living', part, hubWeather());
  const started = Object.keys(state.done).length > 0;
  $('#btn-start').textContent = started ? '回到四楼' : '搬进去';
  $('#btn-start').addEventListener('click', () => {
    $('#title').hidden = true;
    if (state.settings.sound) setSound(true);
    if (!started) continueStory();
    else enterHub();
  });
  window.__FF__ = { get state() { return state; }, get mode() { return mode; }, chapter: chapter1 };
}
boot();
