// Character chat. When no provider is configured (the default), callers fall back to the
// built-in idle lines; this module never runs unless the player turns it on in settings.

import { CHARACTERS, WORLD } from '../../story/bible.js';
import { buildRequest, parseResponse, resolveConfig } from './providers.js';

const MEMORY_LABELS = {
  item: '搬来时带的东西',
  cilantro: '吃不吃香菜（yes=吃，no=不吃）',
  nickname: '小满给起的外号',
  reason: '来这座城市的原因',
  nicoWord: '教给 Nico 的中文词',
  book: '从老周那借的书',
  replyToAche: '回给阿澈便利贴的话'
};

export function isEnabled(settings) {
  return !!(settings?.llm?.enabled && resolveConfig(settings.llm));
}

export function systemPrompt(id, state, sceneTitles = []) {
  const c = CHARACTERS[id];
  const facts = Object.entries(state.mem)
    .filter(([k]) => MEMORY_LABELS[k])
    .map(([k, v]) => `- ${MEMORY_LABELS[k]}：${v}`)
    .join('\n');
  const closeness = state.aff[id] ?? 0;
  return [
    `你是「${c.name}」，住在一栋老公寓的四楼合租房里。正在和室友「${state.name || '你'}」聊天。`,
    `世界：${WORLD.premise}`,
    `你的身份：${c.role}${c.age ? `，${c.age} 岁` : ''}。`,
    `性格：${c.personality}`,
    `说话方式：${c.speech}`,
    `习惯：${c.habits.join('；')}。喜欢：${c.likes.join('、')}。不喜欢：${c.dislikes.join('、')}。`,
    `和其他人：${Object.values(c.relations).join('；') || '无'}。`,
    `你心里的事（不要主动全盘说出，只能慢慢透露）：${c.arc.join(' ')}`,
    `你们的亲近程度：${closeness}（-5 到 20，越高越亲近）。`,
    facts ? `你记得关于对方的事：\n${facts}` : '',
    sceneTitles.length ? `你们一起经历过：${sceneTitles.join('、')}。` : '',
    '规则：只用中文；每次回复一到三句，像日常说话；不要旁白，不要列表；不提自己是 AI 或程序；不替对方说话；对方难过时先陪着，不说教。'
  ].filter(Boolean).join('\n');
}

export async function chat({ id, state, history, sceneTitles, fetchImpl = globalThis.fetch, signal }) {
  const cfg = state.settings.llm;
  const { url, init } = buildRequest(cfg, systemPrompt(id, state, sceneTitles), history);
  const res = await fetchImpl(url, { ...init, signal });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 200); } catch { /* ignore */ }
    throw new Error(`HTTP ${res.status} ${detail}`);
  }
  const data = await res.json();
  const text = parseResponse(resolveConfig(cfg).format, data);
  if (!text) throw new Error('空回复');
  return text;
}
