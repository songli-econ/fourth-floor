import test from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS, buildRequest, parseResponse } from '../src/llm/providers.js';
import { chat, systemPrompt, isEnabled } from '../src/llm/index.js';
import { newState } from '../src/state.js';

const msgs = [{ role: 'user', content: '你好' }];

test('every provider builds a well-formed request', () => {
  for (const [id, p] of Object.entries(PROVIDERS)) {
    if (!p.format) continue;
    const cfg = { provider: id, key: 'k', model: 'm', endpoint: id === 'custom' ? 'https://example.test/v1/chat/completions' : '' };
    const { url, init } = buildRequest(cfg, 'SYS', msgs);
    assert.match(url, /^https?:\/\//, id);
    const body = JSON.parse(init.body);
    assert.equal(init.method, 'POST');
    if (p.format === 'anthropic') {
      assert.equal(body.system, 'SYS'); assert.equal(init.headers['x-api-key'], 'k');
      assert.equal(init.headers['anthropic-dangerous-direct-browser-access'], 'true');
    }
    if (p.format === 'openai') { assert.equal(body.messages[0].role, 'system'); assert.equal(init.headers.authorization, 'Bearer k'); }
    if (p.format === 'gemini') { assert.ok(url.endsWith('/m:generateContent')); assert.equal(body.contents[0].role, 'user'); }
    if (p.format === 'ollama') assert.equal(body.stream, false);
  }
});

test('missing config is reported, not sent', () => {
  assert.throws(() => buildRequest({ provider: 'openai', key: 'k', model: '' }, 's', msgs), /模型/);
  assert.throws(() => buildRequest({ provider: 'anthropic', key: '', model: 'x' }, 's', msgs), /key/);
  assert.throws(() => buildRequest({ provider: 'custom', model: 'x' }, 's', msgs), /接口/);
  assert.throws(() => buildRequest({ provider: 'none' }, 's', msgs));
});

test('responses parse per format', () => {
  assert.equal(parseResponse('anthropic', { content: [{ type: 'text', text: ' 嗯。' }] }), '嗯。');
  assert.equal(parseResponse('openai', { choices: [{ message: { content: '好' } }] }), '好');
  assert.equal(parseResponse('gemini', { candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] } }] }), 'ab');
  assert.equal(parseResponse('ollama', { message: { content: 'x' } }), 'x');
});

test('system prompt carries persona and memory', () => {
  const s = newState('小林');
  s.mem.cilantro = 'no'; s.mem.book = '旧诗集'; s.aff.ache = 7;
  const p = systemPrompt('ache', s, ['雨']);
  for (const frag of ['阿澈', '小林', '香菜', 'no', '7', '雨', '只用中文']) assert.ok(p.includes(frag), frag);
});

test('chat calls fetch once and returns text; errors surface', async () => {
  const s = newState('小林');
  s.settings.llm = { enabled: true, provider: 'deepseek', key: 'k', model: '', endpoint: '' };
  assert.ok(isEnabled(s.settings));
  let calls = 0;
  const ok = async (url, init) => { calls++; assert.match(url, /deepseek/); return { ok: true, json: async () => ({ choices: [{ message: { content: '吃了吗？' } }] }) }; };
  assert.equal(await chat({ id: 'ache', state: s, history: msgs, fetchImpl: ok }), '吃了吗？');
  assert.equal(calls, 1);
  const bad = async () => ({ ok: false, status: 401, text: async () => 'unauthorized' });
  await assert.rejects(chat({ id: 'ache', state: s, history: msgs, fetchImpl: bad }), /401/);
  s.settings.llm.enabled = false;
  assert.ok(!isEnabled(s.settings));
});
