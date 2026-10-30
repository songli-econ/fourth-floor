// Provider table and request/response shapes. Endpoints and example model names follow each
// vendor's public docs as known at the time of writing; the settings panel lets the player
// override both, so a renamed model or moved endpoint never needs a code change.
//
// Formats:
//   anthropic  POST /v1/messages              { system, messages, max_tokens }
//   openai     POST .../chat/completions       { messages:[{role:'system'},...] }   (also DeepSeek, Qwen, Kimi, GLM, custom)
//   gemini     POST .../models/{m}:generateContent { systemInstruction, contents }
//   ollama     POST /api/chat                  { messages, stream:false }

export const PROVIDERS = {
  none:      { label: '不接入（使用内置台词）', format: null },
  anthropic: { label: 'Anthropic Claude', format: 'anthropic', endpoint: 'https://api.anthropic.com/v1/messages', model: 'claude-sonnet-5-5', needsKey: true },
  openai:    { label: 'OpenAI', format: 'openai', endpoint: 'https://api.openai.com/v1/chat/completions', model: '', modelHint: '填写模型名', needsKey: true },
  gemini:    { label: 'Google Gemini', format: 'gemini', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models', model: '', modelHint: '填写模型名', needsKey: true },
  deepseek:  { label: 'DeepSeek', format: 'openai', endpoint: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat', needsKey: true },
  qwen:      { label: '通义千问（阿里云百炼）', format: 'openai', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-plus', needsKey: true },
  kimi:      { label: 'Kimi（月之暗面）', format: 'openai', endpoint: 'https://api.moonshot.cn/v1/chat/completions', model: '', modelHint: '填写模型名', needsKey: true },
  glm:       { label: '智谱 GLM', format: 'openai', endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: '', modelHint: '填写模型名', needsKey: true },
  ollama:    { label: 'Ollama（本机）', format: 'ollama', endpoint: 'http://localhost:11434/api/chat', model: '', modelHint: '本机已拉取的模型名', needsKey: false },
  custom:    { label: '自定义（OpenAI 兼容）', format: 'openai', endpoint: '', model: '', modelHint: '填写模型名', needsKey: false }
};

export function resolveConfig(cfg) {
  const p = PROVIDERS[cfg.provider];
  if (!p || !p.format) return null;
  return {
    format: p.format,
    endpoint: (cfg.endpoint || p.endpoint || '').trim(),
    model: (cfg.model || p.model || '').trim(),
    key: (cfg.key || '').trim(),
    needsKey: p.needsKey
  };
}

export function buildRequest(cfg, system, messages, maxTokens = 300) {
  const c = resolveConfig(cfg);
  if (!c) throw new Error('未选择厂商');
  if (!c.endpoint) throw new Error('缺少接口地址');
  if (!c.model) throw new Error('缺少模型名');
  if (c.needsKey && !c.key) throw new Error('缺少 API key');
  const json = body => JSON.stringify(body);
  switch (c.format) {
    case 'anthropic':
      return {
        url: c.endpoint,
        init: {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': c.key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: json({ model: c.model, max_tokens: maxTokens, system, messages })
        }
      };
    case 'openai': {
      const headers = { 'content-type': 'application/json' };
      if (c.key) headers.authorization = `Bearer ${c.key}`;
      return {
        url: c.endpoint,
        init: { method: 'POST', headers, body: json({ model: c.model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, ...messages] }) }
      };
    }
    case 'gemini':
      return {
        url: `${c.endpoint.replace(/\/$/, '')}/${encodeURIComponent(c.model)}:generateContent`,
        init: {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': c.key },
          body: json({
            systemInstruction: { parts: [{ text: system }] },
            contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
            generationConfig: { maxOutputTokens: maxTokens }
          })
        }
      };
    case 'ollama':
      return {
        url: c.endpoint,
        init: { method: 'POST', headers: { 'content-type': 'application/json' }, body: json({ model: c.model, stream: false, messages: [{ role: 'system', content: system }, ...messages] }) }
      };
    default:
      throw new Error(`unknown format ${c.format}`);
  }
}

export function parseResponse(format, data) {
  switch (format) {
    case 'anthropic': return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    case 'openai': return (data.choices?.[0]?.message?.content || '').trim();
    case 'gemini': return (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    case 'ollama': return (data.message?.content || '').trim();
    default: return '';
  }
}
