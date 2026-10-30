// The bundled single file must work from file:// with no server.
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../../md2epub/tools/headless.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const b = await launch({ extraArgs: ['--window-size=1100,760'] });
let ok = true;
const step = (c, m) => { console.log((c ? '✔ ' : '✖ ') + m); ok = ok && !!c; };
try {
  await b.navigate('file://' + join(root, 'dist/fourth-floor.html') + '?fast=1&today=2026-10-29&part=night');
  await b.waitFor('window.__FF__', 'boot');
  await b.evaluate(`localStorage.clear(); true`);
  await b.evaluate(`document.querySelector('#btn-start').click(); true`);
  await new Promise(r => setTimeout(r, 400));
  await b.evaluate(`document.querySelector('#card').click(); true`);
  await b.waitFor(`!document.querySelector('#dialog').hidden && document.querySelector('#line').textContent.length > 5`, 'first line');
  step(true, '单文件版从 file:// 打开，序章第一句出现：' + (await b.evaluate(`document.querySelector('#line').textContent.slice(0, 16)`)));
  step(await b.evaluate(`document.querySelector('#bg .bg-layer.on svg') !== null`), '背景画出来了');
  step(b.errors.length === 0, '控制台无报错' + (b.errors.length ? '：' + b.errors.join(' | ') : ''));
} catch (e) {
  step(false, String(e));
} finally {
  await b.close();
}
process.exit(ok ? 0 : 1);
