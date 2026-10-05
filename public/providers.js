// One call, four providers. Each takes the same input and returns the model's text; app.js parses and validates it.
// All of them are called straight from the browser (CORS verified), with the user's own key.
//
//   gemini      Google AI Studio free tier       native generateContent, JSON schema enforced
//   groq        Groq free plan                   OpenAI-compatible, JSON mode
//   openrouter  OpenRouter free models           OpenAI-compatible, JSON mode ("openrouter/free" picks a free model)
//   anthropic   Claude (pay as you go)           Messages API, JSON schema enforced
export const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', free: true, model: 'gemini-2.5-flash', keyHint: 'AIza…', keyUrl: 'https://aistudio.google.com/apikey' },
  { id: 'groq', name: 'Groq', free: true, model: 'openai/gpt-oss-20b', keyHint: 'gsk_…', keyUrl: 'https://console.groq.com/keys' },
  { id: 'openrouter', name: 'OpenRouter', free: true, model: 'openrouter/free', keyHint: 'sk-or-…', keyUrl: 'https://openrouter.ai/keys' },
  { id: 'anthropic', name: 'Claude', free: false, model: 'claude-sonnet-5-5', keyHint: 'sk-ant-…', keyUrl: 'https://console.anthropic.com/settings/keys' },
];
export const byId = id => PROVIDERS.find(p => p.id === id) || PROVIDERS[0];

// kind: net | key | rate | stuck | http. app.js turns these into translated messages.
export class AiError extends Error {
  constructor(kind, status, detail) { super(kind); this.kind = kind; this.status = status; this.detail = detail; }
}

async function post(url, headers, body) {
  let res;
  try { res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }); }
  catch { throw new AiError('net'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error?.message || data[0]?.error?.message || '';
    if (res.status === 401 || res.status === 403 || (res.status === 400 && /api[ _-]?key/i.test(msg))) throw new AiError('key', res.status, msg); // Gemini answers a bad key with 400
    if (res.status === 429) throw new AiError('rate', res.status, msg);
    throw new AiError('http', res.status, msg);
  }
  return data;
}

// Gemini's responseSchema is an OpenAPI subset: it rejects additionalProperties
const stripExtra = s => Array.isArray(s) ? s.map(stripExtra)
  : s && typeof s === 'object' ? Object.fromEntries(Object.entries(s).filter(([k]) => k !== 'additionalProperties').map(([k, v]) => [k, stripExtra(v)])) : s;

const adapters = {
  async anthropic({ key, model, system, user, schema }) {
    const d = await post('https://api.anthropic.com/v1/messages', {
      'x-api-key': key, 'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true', // required for browser CORS; the key stays on this device
    }, {
      model, max_tokens: 4000, system, messages: [{ role: 'user', content: user }],
      output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    });
    if (d.stop_reason === 'refusal' || d.stop_reason === 'max_tokens') throw new AiError('stuck');
    return d.content?.find(b => b.type === 'text')?.text;
  },

  async gemini({ key, model, system, user, schema }) {
    const d = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { 'x-goog-api-key': key }, {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: 'application/json', responseSchema: stripExtra(schema), maxOutputTokens: 8192,
        ...(/2\.5-flash/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}), // plain JSON answer: skip the reasoning phase for speed
      },
    });
    const c = d.candidates?.[0];
    if (!c || d.promptFeedback?.blockReason || c.finishReason === 'MAX_TOKENS') throw new AiError('stuck');
    return (c.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
  },

  async openaiLike(url, { key, model, system, user }, extra = {}) {
    const d = await post(url, { authorization: `Bearer ${key}` }, {
      model, max_tokens: 4000, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }], ...extra,
    });
    const c = d.choices?.[0];
    if (!c?.message?.content || c.finish_reason === 'length') throw new AiError('stuck');
    return c.message.content;
  },
};
adapters.groq = a => adapters.openaiLike('https://api.groq.com/openai/v1/chat/completions', a, /gpt-oss/.test(a.model) ? { reasoning_effort: 'low' } : {});
adapters.openrouter = a => adapters.openaiLike('https://openrouter.ai/api/v1/chat/completions', a);

export const callProvider = ({ provider, ...args }) => adapters[provider](args);
