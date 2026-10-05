// One call, four providers. Each takes the same input and returns the model's text; app.js parses and validates it.
// All of them are called straight from the browser (CORS verified), with the user's own key.
//
//   gemini      Google AI Studio free tier       Interactions API, JSON schema enforced (generateContent kept as a fallback)
//   groq        Groq free plan                   OpenAI-compatible, JSON mode
//   openrouter  OpenRouter free models           OpenAI-compatible, JSON mode ("openrouter/free" picks a free model)
//   anthropic   Claude (pay as you go)           Messages API, JSON schema enforced
export const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', free: true, model: 'gemini-3.8-flash', keyHint: 'AIza…', keyUrl: 'https://aistudio.google.com/apikey' },
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

  // Google retires free-tier models quickly (2.5-flash was cut off for new keys), so this adapter heals itself:
  // if the model is gone it asks the user's own key which Flash models exist, picks the newest and remembers it.
  async gemini(a) {
    const G = 'https://generativelanguage.googleapis.com/v1beta';
    const headers = { 'x-goog-api-key': a.key };
    const gone = e => e instanceof AiError && e.kind === 'http' && [400, 404].includes(e.status) && /model/i.test(e.detail || '') && /no longer available|not found|not supported|deprecated|retired|unavailable/i.test(e.detail || ''); // must name the model: a bare 'Method not found' is a different problem

    const viaInteractions = async (model, thinking = true) => {
      let d;
      try {
        d = await post(`${G}/interactions`, headers, {
          model, input: a.user, system_instruction: a.system,
          generation_config: { max_output_tokens: 8192, ...(thinking ? { thinking_level: 'low' } : {}) }, // plain JSON answer: keep reasoning short
          response_format: { type: 'text', mime_type: 'application/json', schema: a.schema },
        });
      } catch (e) {
        if (thinking && e instanceof AiError && e.kind === 'http' && e.status === 400 && /thinking/i.test(e.detail || '')) return viaInteractions(model, false); // model has no thinking levels
        throw e;
      }
      const text = (d.steps || []).filter(x => x.type === 'model_output').flatMap(x => x.content || []).map(c => c.text || '').join('');
      if (!text || /^(incomplete|failed|cancelled)$/.test(d.status || '')) throw new AiError('stuck');
      return text;
    };

    // the older endpoint, in case Interactions is unavailable for a key or model
    const viaGenerate = async model => {
      const d = await post(`${G}/models/${encodeURIComponent(model)}:generateContent`, headers, {
        systemInstruction: { parts: [{ text: a.system }] },
        contents: [{ role: 'user', parts: [{ text: a.user }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: stripExtra(a.schema), maxOutputTokens: 8192 },
      });
      const c = d.candidates?.[0];
      if (!c || d.promptFeedback?.blockReason || c.finishReason === 'MAX_TOKENS') throw new AiError('stuck');
      return (c.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
    };

    // newest "gemini-N.M-flash" this key can see (stable names only: no -lite, -preview, -tts, -image...)
    const newestFlash = async () => {
      let res; try { res = await fetch(`${G}/models?pageSize=1000`, { headers }); } catch { return null; }
      const list = (await res.json().catch(() => ({}))).models || [];
      const found = list.map(m => /^models\/(gemini-(\d+)(?:\.(\d+))?-flash)$/.exec(m.name || '')).filter(Boolean)
        .map(m => ({ id: m[1], v: [+m[2], +(m[3] || 0)] })).sort((x, y) => y.v[0] - x.v[0] || y.v[1] - x.v[1]);
      return found[0]?.id || null;
    };

    const attempt = async model => {
      try { return await viaInteractions(model); }
      catch (e) { if (e instanceof AiError && e.kind === 'http' && [404, 405, 501].includes(e.status) && !gone(e)) return viaGenerate(model); throw e; }
    };
    try { return await attempt(a.model); }
    catch (e) {
      if (!gone(e)) throw e;
      const next = await newestFlash();
      if (!next || next === a.model) throw e;
      const text = await attempt(next);
      a.onModel?.(next); // only remembered once it actually worked
      return text;
    }
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
