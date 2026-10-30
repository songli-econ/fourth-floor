// Plays the prologue and day 1 in a headless browser, checks state, and saves screenshots
// to tests/shots/ for a human to look at.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../../md2epub/tools/headless.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shots = join(root, 'tests', 'shots');
await mkdir(shots, { recursive: true });

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = join(root, path === '/' ? 'index.html' : path);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
// FF_BASE=https://... runs the same checks against a deployed copy.
const base = process.env.FF_BASE || `http://127.0.0.1:${server.address().port}/`;

const b = await launch({ extraArgs: ['--window-size=1280,800'] });
let ok = true;
const step = (cond, msg) => { console.log((cond ? '✔ ' : '✖ ') + msg); ok = ok && !!cond; };
const shot = async name => {
  const { data } = await b.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(shots, `${name}.png`), Buffer.from(data, 'base64'));
};
const castAt = {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const visible = sel => b.evaluate(`!document.querySelector('${sel}').hidden`);

// Drive until `until` (JS expression) is true. Takes named screenshots the first time a
// given UI state appears.
async function drive(until, label, seen = new Set(), maxSteps = 600, opts = {}) {
  for (let i = 0; i < maxSteps; i++) {
    if (await b.evaluate(until)) return true;
    const st = await b.evaluate(`({
      choices: !document.querySelector('#choices').hidden,
      ask: !document.querySelector('#ask').hidden,
      note: !document.querySelector('#note').hidden,
      card: !document.querySelector('#card').hidden,
      dialog: !document.querySelector('#dialog').hidden,
      speaker: document.querySelector('#nameplate').textContent
    })`);
    for (const k of ['choices', 'ask', 'note', 'card']) {
      if (st[k] && !seen.has(k)) { seen.add(k); await sleep(700); await shot(`${label}-${k}`); }
    }
    if (st.dialog && st.speaker && !seen.has('say')) { seen.add('say'); await sleep(500); await shot(`${label}-say`); }
    if (opts.hubContinue && await b.evaluate(`window.__FF__.mode === 'hub' && !document.querySelector('#hub-story').hidden && document.querySelector('#dialog').hidden`)) {
      await b.evaluate(`document.querySelector('#hub-story').click(); true`); await sleep(100); continue;
    }
    if (opts.shotWhen) for (const [name, re] of opts.shotWhen) {
      if (!seen.has(name) && st.dialog && new RegExp(re).test(await b.evaluate(`document.querySelector('#line').textContent`))) { seen.add(name); await sleep(900); await shot(name); castAt[name] = await b.evaluate(`[...document.querySelectorAll('#cast .actor')].filter(e => getComputedStyle(e).opacity === '1').map(e => e.dataset.id).sort().join(',')`); }
    }
    if (st.choices) await b.evaluate(`document.querySelector('#choices button').click(); true`);
    else if (st.ask) await b.evaluate(`document.querySelector('#ask-input').value = '小林'; document.querySelector('#ask button').click(); true`);
    else if (st.note) await b.evaluate(`document.querySelector('#note').click(); true`);
    else if (st.card) await b.evaluate(`document.querySelector('#card').click(); true`);
    else await b.evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); true`);
    await sleep(60);
  }
  const dump = await b.evaluate(`JSON.stringify({ mode: window.__FF__.mode, done: Object.keys(window.__FF__.state.done), line: document.querySelector('#line').textContent.slice(0, 30), dlg: !document.querySelector('#dialog').hidden, ask: !document.querySelector('#ask').hidden, card: !document.querySelector('#card').hidden, note: !document.querySelector('#note').hidden, ch: !document.querySelector('#choices').hidden })`);
  throw new Error('drive timeout: ' + label + ' ' + dump + ' errors=' + b.errors.join('|'));
}

try {
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await b.navigate(base + '?today=2026-10-29&part=dusk&fast=1');
  await b.waitFor(`window.__FF__ && document.querySelector('#btn-start')`, 'boot');
  await b.evaluate(`localStorage.clear(); true`);
  await b.navigate(base + '?today=2026-10-29&part=dusk&fast=1');
  await b.waitFor(`window.__FF__`, 'boot2');
  await sleep(1500);
  await shot('00-title');
  step(await b.evaluate(`document.querySelector('#btn-start').textContent === '搬进去'`), '首次打开显示「搬进去」');

  await b.evaluate(`document.querySelector('#btn-start').click(); true`);
  await drive(`window.__FF__.mode === 'hub'`, '01-prologue');
  const s0 = await b.evaluate(`JSON.parse(JSON.stringify(window.__FF__.state))`);
  step(s0.name === '小林', `名字记下了：${s0.name}`);
  step(s0.done['d0-arrive'] && s0.done['d0-meet'], '序章两段都完成');
  step(s0.dayDoneOn['0'] === '2026-10-29', '序章完成日期记为当天');
  await sleep(1300);
  await shot('02-hub-wait');
  const hint = await b.evaluate(`document.querySelector('#hub-hint').textContent`);
  step(/明天/.test(hint) && !(await visible('#hub-story')), `真实时间：第 1 天要等到明天（${hint.slice(0, 24)}…）`);

  // Tap a resident in the hub: built-in idle line.
  await b.evaluate(`document.querySelector('.actor.clickable').click(); true`);
  await sleep(600);
  step(await visible('#dialog'), '点角色会说一句日常的话');
  await shot('03-hub-chat');
  await b.evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); true`);

  // Next real day: day 1 unlocks; play it through.
  await b.navigate(base + '?today=2026-10-30&part=dawn&fast=1');
  await b.waitFor(`window.__FF__`, 'boot3');
  await sleep(800);
  step(await b.evaluate(`document.querySelector('#btn-start').textContent === '回到四楼'`), '再次打开显示「回到四楼」');
  await b.evaluate(`document.querySelector('#btn-start').click(); true`);
  await sleep(600);
  step(await visible('#hub-story'), '第二天出现「继续：第 1 天」');
  await b.evaluate(`document.querySelector('#hub-story').click(); true`);
  await drive(`window.__FF__.mode === 'hub'`, '04-day1');
  const s1 = await b.evaluate(`JSON.parse(JSON.stringify(window.__FF__.state))`);
  step(['d1-morning', 'd1-evening', 'd1-night'].every(id => s1.done[id]), '第 1 天三段都完成');
  step(s1.mem.cilantro && s1.mem.nickname && s1.mem.reason, `记住了香菜/外号/来这儿的原因：${s1.mem.cilantro}/${s1.mem.nickname}/${s1.mem.reason}`);

  // Settings dialog and save export shape.
  await b.evaluate(`document.querySelector('[data-act=settings]').click(); true`);
  await sleep(400);
  await shot('05-settings');
  const providers = await b.evaluate(`document.querySelector('#set-provider').options.length`);
  step(providers >= 9, `设置里列出 ${providers} 个大模型选项`);
  await b.evaluate(`document.querySelector('#settings-modal').close(); true`);

  // Phone width.
  await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await b.navigate(base + '?today=2026-10-31&part=night&fast=1');
  await b.waitFor(`window.__FF__`, 'boot4');
  await b.evaluate(`document.querySelector('#btn-start').click(); true`);
  await sleep(900);
  await shot('06-phone-hub');
  await b.evaluate(`document.querySelector('#hub-story').click(); true`);
  await drive(`!document.querySelector('#dialog').hidden && document.querySelector('#nameplate').textContent`, '07-phone');
  await sleep(500);
  await shot('07-phone-say');
  const overflow = await b.evaluate(`document.documentElement.scrollWidth > innerWidth`);
  step(!overflow, '手机宽度没有横向溢出');

  // The whole chapter, no waiting, back on a desktop window.
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await b.evaluate(`localStorage.clear(); localStorage.setItem('fourth-floor.settings.v1', JSON.stringify({ pace: 'free', textSpeed: 0, sound: false, llm: {} })); true`);
  await b.navigate(base + '?today=2026-11-01&part=dusk&fast=1');
  await b.waitFor(`window.__FF__`, 'boot5');
  await b.evaluate(`document.querySelector('#btn-start').click(); true`);
  await drive(`window.__FF__.state.done['d14-night'] && window.__FF__.mode === 'hub'`, '08-full', new Set(), 4000, {
    hubContinue: true,
    shotWhen: [['09-dinner', '多出来的碗筷|你数了数碗筷'], ['10-blackout', '停电了'], ['11-rooftop-end', '你那一格，终于有了一张脸'], ['12-chapter-end', '第一章 · 四楼的灯 · 完']]
  });
  step(castAt['09-dinner'] === 'ache,laozhou,nico,xiaoman', `饭局四个人都在场（${castAt['09-dinner']}）`);
  step(castAt['11-rooftop-end'] === 'ache,laozhou,nico,xiaoman', `天台合影四个人都在场（${castAt['11-rooftop-end']}）`);
  step(castAt['10-blackout'] === 'xiaoman', `停电那句只有小满在场（${castAt['10-blackout']}）`);
  const sf = await b.evaluate(`JSON.parse(JSON.stringify(window.__FF__.state))`);
  step(Object.keys(sf.done).length === (await b.evaluate(`window.__FF__.chapter.scenes.length`)), `整章 ${Object.keys(sf.done).length} 段全部走完`);
  await sleep(1200);
  await shot('13-hub-after-chapter');
  step(/第一章到这里结束/.test(await b.evaluate(`document.querySelector('#hub-hint').textContent`)), '章节结束后四楼里显示「第一章到这里结束」');

  step(b.errors.length === 0, `控制台无报错${b.errors.length ? '：' + b.errors.slice(0, 3).join(' | ') : ''}`);
} catch (e) {
  step(false, String(e.stack || e));
} finally {
  await b.close();
  server.close();
}
console.log(ok ? '\nE2E OK' : '\nE2E FAILED');
process.exit(ok ? 0 : 1);
