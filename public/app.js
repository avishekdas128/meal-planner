import { DAYS, AVATARS, ALLERGIES, REGIONS, dishesFor, PANTRY, STAPLES, DISH_EMOJI } from './data.js';
import './emoji.js'; // swaps every emoji for a bundled SVG so it looks the same on every phone
import { LANGS, WORDS, t, lang, setLang, loadWordFonts, fontOf, weightOf, dayLabel, dateLabel } from './i18n.js';
import { PROVIDERS, byId, callProvider, AiError } from './providers.js';

const KEY = 'kkb:v1'; // localStorage, not cookies: prefs + pantry blow past the 4KB cookie cap
const MEALS = { breakfast: '🍳', lunch: '🍛', dinner: '🌙' };
const DIET_E = { veg: '🥦', egg: '🥚', nonveg: '🍗', jain: '🌿' };
const SKILL_E = { beginner: '🍳', average: '👨‍🍳', pro: '🧑‍🍳' };
const BUDGET_E = { low: '💸', normal: '🙂', high: '🤑' };
const GOAL_E = { none: '🍽️', lose: '🥗', muscle: '💪', sugar: '🩸', gentle: '🫶' };
const BRK_E = { light: '☕', full: '🥞', skip: '😴' };
const THEMES = ['dark', 'light', 'auto'];

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toLocaleDateString('en-CA');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const mealName = m => t('meal.' + m);
const minLabel = n => (n === 60 ? t('unit.hour') : t('unit.min', { n }));

const blank = () => ({
  provider: 'gemini', keys: {}, models: {}, done: false, theme: 'dark', lang: '',
  house: { skill: 'average', maxMin: 45, budget: 'normal', nvOff: [], notes: '', meals: ['breakfast', 'lunch', 'dinner'], repeat: 7 },
  people: [], inventory: Object.fromEntries(STAPLES.map(i => [i, true])), custom: [], history: [], plan: null,
});
let S;
try {
  const b = blank(), l = JSON.parse(localStorage.getItem(KEY) || '{}');
  S = { ...b, ...l, house: { ...b.house, ...l.house }, keys: { ...l.keys }, models: { ...l.models } };
  if (l.apiKey) { S.keys.anthropic ||= l.apiKey; if (!l.provider) S.provider = 'anthropic'; } // older versions only knew Claude
  delete S.apiKey;
} catch { S = blank(); }
const apiKey = () => S.keys[S.provider] || '';
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast(t('err.storage')); } };
const detectLang = () => { const c = (navigator.language || 'en').slice(0, 2); return LANGS.some(l => l.c === c) ? c : 'en'; };

const h = new Date().getHours();
const ui = { view: S.done ? 'today' : 'q', qi: 0, tab: 0, cat: 'grains', more: {}, anim: true, draft: null, draftIdx: -1, loading: null, meals: { breakfast: h < 11, lunch: h < 16, dinner: true } };

/* ---------- theme ---------- */
const effective = () => (S.theme === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : S.theme);
function applyTheme() {
  document.documentElement.dataset.theme = S.theme;
  requestAnimationFrame(() => { $('meta[name=theme-color]').content = getComputedStyle(document.body).backgroundColor; });
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => S.theme === 'auto' && applyTheme());

/* ---------- animated logo: the word for "food" cycles through every supported script ---------- */
let wi = 0;
const kwStyle = l => `font-family:${fontOf(l)},'Mukta',sans-serif;font-weight:${weightOf(l)}`;
const logo = cls => { const l = WORDS[wi]; return `<span class="logo ${cls}" role="img" aria-label="Khana Plan"><span class="kw" lang="${l.c}" style="${kwStyle(l)}">${l.w}</span><em>Plan</em></span>`; };
function tickLogo() {
  wi = (wi + 1) % WORDS.length; const l = WORDS[wi];
  document.querySelectorAll('.kw').forEach(e => {
    e.textContent = l.w; e.lang = l.c; e.style.cssText = kwStyle(l);
    e.classList.remove('flip'); void e.offsetWidth; e.classList.add('flip');
  });
}

/* ---------- helpers ---------- */
const has = i => !!S.inventory[i.toLowerCase()];
const planned = () => (S.plan?.date === today() ? S.plan : null);
const missingOf = o => (o.missing || []).filter(m => !has(m));
const activeMeals = () => Object.keys(MEALS).filter(m => S.house.meals.includes(m));
const pickedOpts = () => { const p = planned(); return p ? Object.keys(MEALS).filter(m => p.pick[m] != null).map(m => [m, p.meals[m]?.[p.pick[m]]]).filter(x => x[1]) : []; };
const cartItems = () => [...new Set(pickedOpts().flatMap(([, o]) => missingOf(o).map(x => x.toLowerCase())))];
const newPerson = () => ({ name: '', emoji: AVATARS[S.people.length % AVATARS.length], diet: 'veg', spice: 3, goal: 'none', brk: 'light', allergies: [], loves: [], hates: [], regions: [] });

let toastT;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600);
}
const buzz = (n = 15) => navigator.vibrate?.(n);

async function share(text) {
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); toast(t('toast.copied')); }
  } catch (e) { if (e.name !== 'AbortError') toast(t('toast.sharefail')); }
}

/* ---------- confetti (tiny, no dependency) ---------- */
function confetti(x = innerWidth / 2, y = innerHeight / 2, n = 40) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('#fx'), g = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#e0992e', '#c0432b', '#4a7a45', '#f3eadb', '#8a5a2b'];
  const ps = Array.from({ length: n }, () => ({ x, y, vx: (Math.random() - .5) * 14, vy: -Math.random() * 12 - 3, r: Math.random() * 6, s: 5 + Math.random() * 6, c: cols[Math.random() * 5 | 0] }));
  let f = 0;
  (function tick() {
    g.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .45; p.r += .2; g.fillStyle = p.c; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); g.restore(); });
    if (++f < 90) requestAnimationFrame(tick); else g.clearRect(0, 0, c.width, c.height);
  })();
}

/* ---------- AI ---------- */
const SYSTEM = `You are the meal-planning brain for a flat of bachelors in an Indian city who have a cook. Suggest realistic Indian home-style dishes the cook can make.
Rules:
- Diets: if the squad is mixed, shared dishes must suit the strictest diet present (jain = no onion, garlic or root vegetables; veg = no meat/fish/egg; egg = veg + eggs). If there is a non-veg eater, you may offer non-veg options but note in "why" who it suits. If nonVegOffToday is true, no meat/fish/egg dishes today.
- Never include listed allergies. Avoid dishes people hate. Lean towards loves, regions and spice levels (1 mild to 5 fiery; pick a level the whole house can enjoy). Respect cook skill, maxMinutes, budget and any house notes.
- Goals: lose = lighter, low oil; muscle = high protein; sugar = low sugar, low refined carbs; gentle = simple, easy to digest. Mention in "why" when a dish serves someone's goal. Breakfast style: light = quick items, full = substantial, skip = don't design around them.
- Variety: don't repeat anything in recentMeals within repeatEveryDays; dishes rated -1 never come back; dishes rated 1 may return after that window.
- Breakfast should be breakfast-ish, lunch/dinner proper meals. Give each requested meal exactly 3 options: at least one that is fully makeable from the pantry (missing = []), and at least one tempting option that needs a few items ordered. Don't repeat dishes across meals or in alreadyShown.
- "missing" lists only key ingredients not in the pantry (assume water, and anything in the pantry list). Use short English grocery names like "paneer", "capsicum", whatever the language.
- "dish" is the name a cook would recognise in Roman script, like "Jeera aloo with phulka" (never a marketing title). "emoji" must be the closest match from the allowed list.
- "why" is one short, specific line (max 14 words) on why it fits this house today. Name a person, the pantry, a goal or the time pressure. Warm and plain, like a flatmate who cooks. No slang, no emojis, no exclamation marks, no filler like "delicious" or "perfect".
- Language: write "why" in the language given in "language", in its native script, mixing in a few common English words the way people really talk (Hindi example: "Rohan की पसंद, और सब कुछ pantry में है."). If the language is English, write plain English. Examples in English: "Rohan's favourite, and everything is already in the kitchen." / "Ready in 20 minutes, light on the stomach."`;

const optSchema = {
  type: 'object', additionalProperties: false, required: ['dish', 'emoji', 'why', 'minutes', 'missing'],
  properties: { dish: { type: 'string' }, emoji: { type: 'string', enum: DISH_EMOJI }, why: { type: 'string' }, minutes: { type: 'integer' }, missing: { type: 'array', items: { type: 'string' } } },
};

// providers without schema enforcement get the exact output shape spelled out in the prompt
const shapeHint = meals => `\n\nOutput format: reply with ONE JSON object and nothing else (no markdown, no commentary): {"meals":{${meals.map(m => `"${m}":[{"dish":"…","emoji":"🍛","why":"…","minutes":25,"missing":["…"]}]`).join(',')}}}. Each meal has exactly 3 options. "emoji" must be exactly one of: ${DISH_EMOJI.join(' ')}. "minutes" is an integer.`;

// models that ignore the schema still occasionally slip: coerce every option into the shape the UI relies on
function normalise(raw, meals) {
  const root = raw?.meals || raw, out = {};
  for (const m of meals) {
    const list = (Array.isArray(root?.[m]) ? root[m] : []).map(o => ({
      dish: String(o?.dish || '').trim(),
      emoji: DISH_EMOJI.includes(o?.emoji) ? o.emoji : '🍛',
      why: String(o?.why || '').trim(),
      minutes: Math.max(5, Math.round(+o?.minutes) || 30),
      missing: (Array.isArray(o?.missing) ? o.missing : []).map(x => String(x).trim()).filter(Boolean),
    })).filter(o => o.dish).slice(0, 3);
    if (!list.length) throw new Error(t('err.parse'));
    out[m] = list;
  }
  return out;
}
const parseJson = text => { const s = String(text || '').replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, ''); return JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1)); };

async function ask(meals, avoid = []) {
  if (!apiKey()) throw new Error(t('err.nokey'));
  const day = DAYS[new Date().getDay()];
  const payload = {
    today: day, language: lang().e, mealsToPlan: meals, alreadyShown: avoid,
    house: { cookSkill: S.house.skill, maxMinutes: S.house.maxMin, budget: S.house.budget, notes: S.house.notes, repeatEveryDays: S.house.repeat, nonVegOffToday: S.house.nvOff.includes(day) },
    people: S.people.map(({ emoji, ...p }) => p),
    pantry: Object.keys(S.inventory).filter(k => S.inventory[k]),
    recentMeals: S.history.slice(-40),
  };
  const schema = {
    type: 'object', additionalProperties: false, required: ['meals'],
    properties: { meals: { type: 'object', additionalProperties: false, required: meals, properties: Object.fromEntries(meals.map(m => [m, { type: 'array', items: optSchema }])) } },
  };
  let text;
  try {
    text = await callProvider({ provider: S.provider, key: apiKey(), model: S.models[S.provider] || byId(S.provider).model, system: SYSTEM + shapeHint(meals), user: JSON.stringify(payload), schema, onModel: m => { S.models[S.provider] = m; save(); } });
  } catch (e) {
    if (!(e instanceof AiError)) throw e;
    throw new Error({ net: t('err.net'), key: t('err.key'), rate: t('err.rate'), stuck: t('err.stuck') }[e.kind] || e.detail || t('err.http', { s: e.status }));
  }
  let raw; try { raw = parseJson(text); } catch { throw new Error(t('err.parse')); }
  return normalise(raw, meals);
}

const loadingLine = () => t('load.' + (1 + Math.random() * 6 | 0));

async function plan(meals, avoid = []) {
  ui.loading = meals; render();
  const iv = setInterval(() => { const e = $('#lmsg'); if (e) e.textContent = loadingLine(); }, 1800);
  try {
    const out = await ask(meals, avoid);
    const p = planned() || (S.plan = { date: today(), meals: {}, pick: {} });
    for (const m of meals) { p.meals[m] = out[m]; delete p.pick[m]; }
    S.history = S.history.filter(x => !(x.date === today() && meals.includes(x.meal) && x.rating === 0));
    save();
  } catch (e) { toast(e.message); } finally { clearInterval(iv); ui.loading = null; render(); }
}

/* ---------- shared sections ---------- */
const chip = (act, data, label, on) => `<button class="chip ${on ? 'on' : ''}" data-act="${act}" ${data}>${label}</button>`;
const single = (keys, cur, act, f, label) => `<div class="chips">${keys.map(k => chip(act, `data-f="${f}" data-v="${k}"`, label(k), String(cur) === String(k))).join('')}</div>`;
const dietLabel = k => `${DIET_E[k]} ${t('diet.' + k)}`;
const goalLabel = k => `${GOAL_E[k]} ${t('goal.' + k + '')}`;
const mealChips = (act, sel, f) => `<div class="chips">${Object.keys(MEALS).map(m => chip(act, `data-f="${f}" data-v="${m}"`, `${MEALS[m]} ${mealName(m)}`, sel(m))).join('')}</div>`;
const dayChips = () => `<div class="chips">${DAYS.map((d, i) => chip('hset', `data-f="nvOff" data-v="${d}"`, dayLabel(i), S.house.nvOff.includes(d))).join('')}</div>`;

function peopleSec() {
  return `<section class="sec"><h2>${t('people.t')}</h2><p class="sub">${t('people.s')}</p>
  ${S.people.map((p, i) => `<div class="card person"><span class="av">${p.emoji}</span><div><b>${esc(p.name)}</b><small>${dietLabel(p.diet)} · 🌶️ ${p.spice}/5</small></div><button class="ico" aria-label="${esc(t('people.edit', { name: p.name }))}" data-act="editP" data-i="${i}">✏️</button></div>`).join('')}
  <button class="btn ghost" data-act="addP">${t('people.add')}</button></section>`;
}

function houseSec() {
  const H = S.house;
  return `<section class="sec"><h2>${t('house.t')}</h2><p class="sub">${t('house.s')}</p>
  <h3>${t('h.skill')}</h3>${single(['beginner', 'average', 'pro'], H.skill, 'hset', 'skill', k => `${SKILL_E[k]} ${t('skill.' + k)}`)}
  <h3>${t('h.meals')}</h3>${mealChips('hset', m => H.meals.includes(m), 'meals')}
  <h3>${t('h.time')}</h3>${single([20, 30, 45, 60, 90], H.maxMin, 'hset', 'maxMin', minLabel)}
  <h3>${t('h.budget')}</h3>${single(['low', 'normal', 'high'], H.budget, 'hset', 'budget', k => `${BUDGET_E[k]} ${t('budget.' + k)}`)}
  <h3>${t('h.repeat')}</h3>${single([3, 7, 14], H.repeat, 'hset', 'repeat', k => t('repeat.' + k))}
  <h3>${t('h.veg')}</h3>${dayChips()}
  <h3>${t('h.notes')}</h3><textarea class="cin" data-bind="notes" placeholder="${esc(t('h.notes.ph'))}">${esc(H.notes)}</textarea></section>`;
}

const provChips = () => `<div class="provs">${PROVIDERS.map(p => `<button class="prov ${S.provider === p.id ? 'on' : ''}" data-act="prov" data-v="${p.id}" aria-pressed="${S.provider === p.id}"><b>${p.name}</b>${p.free ? `<small class="freebadge">${t('prov.free')}</small>` : ''}</button>`).join('')}</div>`;
const keyField = () => { const p = byId(S.provider); return `<input class="cin solid" type="password" autocomplete="off" spellcheck="false" placeholder="${esc(p.keyHint)}" aria-label="${esc(p.name)} API key" value="${esc(apiKey())}" data-bind="apiKey"><a class="getkey" href="${p.keyUrl}" target="_blank" rel="noopener">${t(p.free ? 'prov.get' : 'prov.getpaid')}</a>`; };
const provBox = () => provChips() + keyField();
const keySec = () => { const p = byId(S.provider); return `<section class="sec" id="aisec"><h2>${t('prov.t')}</h2><p class="sub">${t('prov.s')}</p>${provChips()}<h3>${t('key.t')}</h3>${keyField()}<p class="note">${t('key.s')}</p><h3>${t('prov.model')}</h3><input class="cin solid" data-bind="model" aria-label="${t('prov.model')}" placeholder="${esc(p.model)}" value="${esc(S.models[S.provider] || '')}" autocomplete="off" spellcheck="false"></section>`; };

const themeSec = () => `<section class="sec"><h2>${t('theme.t')}</h2><div class="chips" style="margin-top:12px">${THEMES.map(k => chip('theme', `data-v="${k}"`, t('theme.' + k), S.theme === k)).join('')}</div></section>`;
const langSec = () => `<section class="sec"><h2>${t('lang.sec')}</h2><div class="chips" style="margin-top:12px">${LANGS.map(l => `<button class="chip ${S.lang === l.c ? 'on' : ''}" lang="${l.c}" style="font-family:${fontOf(l)},'Mukta',sans-serif" data-act="lang" data-v="${l.c}">${l.n}</button>`).join('')}</div></section>`;

// Pantry is ~85 chips, so categories are an accordion: one open at a time, each header shows how many are in stock.
function pantryBody() {
  const cats = [...PANTRY.map(c => ({ ...c, id: c.k, name: t('cat.' + c.k) })), ...(S.custom.length ? [{ id: 'extras', name: t('pantry.extras'), emoji: '✨', items: S.custom }] : [])];
  return `<div class="chips"><button class="btn sm" data-act="stock" data-v="1">${t('pantry.all')}</button><button class="btn sm" data-act="stock" data-v="0">${t('pantry.none')}</button></div>
  <div class="acc">${cats.map(c => { const open = ui.cat === c.id, n = c.items.filter(has).length;
    return `<div class="accitem ${open ? 'open' : ''}"><button class="acchead" data-act="cat" data-v="${c.id}" aria-expanded="${open}"><span class="accname">${c.emoji} ${c.name}</span><small class="acccount ${n ? 'some' : ''}">${n}/${c.items.length}</small><i aria-hidden="true">▾</i></button>${open ? `<div class="chips accbody">${c.items.map(i => chip('inv', `data-v="${esc(i)}"`, esc(i), has(i))).join('')}</div>` : ''}</div>`; }).join('')}</div>
  <input class="cin" data-f="pantry" placeholder="${esc(t('pantry.add'))}" aria-label="${esc(t('pantry.add'))}" enterkeyhint="done">`;
}
const pantryView = () => `<section class="sec"><h2>${t('pantry.t')}</h2><p class="sub">${t('pantry.s')}</p>${pantryBody()}</section>`;

/* ---------- questionnaire ---------- */
const obig = (tg, f, cur, rows) => rows.map(([v, e, title, sub]) => `<button class="obig ${String(cur) === String(v) ? 'on' : ''}" data-act="qpick" data-t="${tg}" data-f="${f}" data-v="${v}"><span class="e">${e}</span><span><b>${title}</b><small>${sub}</small></span></button>`).join('');
const opts = (tg, f, cur, emo, keys, tk = f) => obig(tg, f, cur, keys.map(k => [k, emo[k], t(`${tk}.${k}`), t(`${tk}.${k}.d`)]));
// Long lists (30 dishes) show the first 12 plus anything already picked; "+N more" expands the rest.
const COLLAPSE = 12;
const pchips = (f, list, sel) => {
  const all = [...new Set([...list, ...sel])], long = all.length > COLLAPSE + 2, open = ui.more[f] || !long;
  const shown = open ? all : all.filter((o, i) => i < COLLAPSE || sel.includes(o));
  return `<div class="chips">${shown.map(o => chip('pk', `data-f="${f}" data-v="${esc(o)}"`, esc(o), sel.includes(o))).join('')}${long ? `<button class="chip more" data-act="more" data-f="${f}">${open ? t('chips.less') : t('chips.more', { n: all.length - shown.length })}</button>` : ''}</div><input class="cin" data-f="${f}" placeholder="${esc(t('chips.add'))}" aria-label="${esc(t('chips.add'))}">`;
};
// Compact picker for 5-way choices: a chip row plus the description of the current pick (instead of five tall rows).
const seg = (tg, f, cur, items, tk = f) => `<div class="chips seg">${items.map(([v, e]) => chip('qset', `data-t="${tg}" data-f="${f}" data-v="${v}"`, `${e} ${tk === 'time' ? minLabel(v) : t(`${tk}.${v}`)}`, String(cur) === String(v))).join('')}</div>${(([v, e]) => `<p class="segdesc"><span>${e}</span>${t(`${tk}.${v}.d`)}</p>`)(items.find(([v]) => String(v) === String(cur)) || items[0])}`;
/* One pass for the whole flat. With one flatmate the questions are personal and use the rich option rows;
   with several, every question shows all flatmates at once (chips per person, or a name-tab strip for the long lists). */
const solo = () => S.people.length === 1;
const P0 = () => S.people[0];
const tp = () => S.people[ui.tab] || P0();            // flatmate being edited on the list pages
const nm = () => `<em>${esc(P0().name.trim() || t('they'))}</em>`;
const ptitle = k => (solo() ? t(`q.${k}.t`, { n: nm() }) : t(`g.${k}.t`));
const grp = (f, keys, label) => S.people.map((p, i) => `<div class="gcard"><div class="ghead"><span class="av">${p.emoji}</span><b>${esc(p.name)}</b></div><div class="chips">${keys.map(k => chip('gset', `data-i="${i}" data-f="${f}" data-v="${k}"`, label(k), String(p[f]) === String(k))).join('')}</div></div>`).join('');
const pick1 = (f, emo, keys) => (solo() ? opts('p', f, P0()[f], emo, keys) : grp(f, keys, k => `${emo[k]} ${t(`${f}.${k}`)}`));
const ptabs = () => (solo() ? '' : `<div class="ptabs"><span class="who">${t('g.who')}</span>${S.people.map((p, i) => chip('ptab', `data-i="${i}"`, `${p.emoji} ${esc(p.name)}`, i === ui.tab)).join('')}</div>`);

const spiceFace = n => (n === 1 ? '🥛' : n === 5 ? '🔥' : '🌶️'.repeat(n - 1));
const spiceBox = () => { const n = P0().spice; return `<div class="spicebox"><div class="sbig" id="sbig">${spiceFace(n)}</div><b id="sname">${t('spice.' + n)}</b><small id="sdesc">${t(`spice.${n}.d`)}</small>
  <input type="range" min="1" max="5" step="1" value="${n}" data-bind="spiceSolo" aria-label="${esc(t('dlg.spice'))}"><div class="sticks"><span>${t('spice.1')}</span><span>${t('spice.5')}</span></div></div>`; };

const Q = ['lang', 'welcome', 'names', 'diet', 'spice', 'allergies', 'goal', 'loves', 'hates', 'regions', 'brk', 'skill', 'meals', 'time', 'budget', 'nv', 'repeat', 'notes', 'pantry', 'key', 'done'];
const SEC_OF = { names: 'flat', diet: 'flat', spice: 'flat', allergies: 'flat', goal: 'flat', loves: 'flat', hates: 'flat', regions: 'flat', brk: 'flat',
  skill: 'kitchen', meals: 'kitchen', time: 'kitchen', budget: 'kitchen', nv: 'kitchen', repeat: 'kitchen', notes: 'kitchen', pantry: 'kitchen', key: 'setup' };
const SEC_E = { flat: '🧑‍🤝‍🧑', kitchen: '🏠', setup: '🔑' };
const HIDE = { nv: () => !S.people.some(p => p.diet === 'nonveg' || p.diet === 'egg') };

const langCards = () => `<div class="lgrid">${LANGS.map(l => `<button class="lcard ${S.lang === l.c ? 'on' : ''}" lang="${l.c}" data-act="lang" data-v="${l.c}" aria-pressed="${S.lang === l.c}"><b style="font-family:${fontOf(l)},'Mukta',sans-serif;font-weight:${weightOf(l)}">${l.n}</b><small>${l.e}</small></button>`).join('')}</div>`;
const langWords = () => `<div class="lwords" aria-hidden="true">${LANGS.map(l => `<span lang="${l.c}" style="font-family:${fontOf(l)},'Mukta',sans-serif">${l.lw}</span>`).join('<i>·</i>')}</div>`;

const STEP = {
  lang: () => ({ e: logo('row lg'), t: t('lang.t'), sub: t('lang.s'), body: langWords() + langCards() }),
  welcome: () => ({ hero: true, cta: t('welcome.cta'), body: `<div class="stackemo"><span>🍛</span><span>🥘</span><span>🫓</span></div>
    <h1 class="hero-h">${logo('stack')}</h1><div class="dev">${t('welcome.tag')}</div><p class="sub lede">${t('welcome.body')}</p>` }),
  names: () => ({ e: '👋', t: t('q.names.t'), sub: t('q.names.s'), ok: S.people.some(p => p.name.trim()), warn: t('q.name.warn'),
    body: `<div class="nlist">${S.people.map((p, i) => `<div class="nrow"><button class="av nav" data-act="cycleAv" data-i="${i}" aria-label="${esc(t('dlg.avatar'))}">${p.emoji}</button><input class="cin solid" data-bind="pname" data-i="${i}" aria-label="${esc(t('dlg.name'))} ${i + 1}" value="${esc(p.name)}" placeholder="${esc(t('name.ph'))}" autocomplete="off" maxlength="20">${S.people.length > 1 ? `<button class="ico" data-act="delP" data-i="${i}" aria-label="${esc(t('dlg.remove'))}">✕</button>` : ''}</div>`).join('')}</div>${S.people.length < 8 ? `<button class="btn ghost addrow" data-act="addRow">${t('q.names.add')}</button>` : ''}` }),
  diet: () => ({ e: '🥗', t: ptitle('diet'), sub: t('q.diet.s'), body: pick1('diet', DIET_E, ['veg', 'egg', 'nonveg', 'jain']) }),
  spice: () => ({ e: '🌶️', t: ptitle('spice'), sub: t('q.spice.s'), body: solo() ? spiceBox() : pick1('spice', { 1: '🥛', 2: '🌶️', 3: '🌶️', 4: '🌶️', 5: '🔥' }, [1, 2, 3, 4, 5]) }),
  allergies: () => ({ e: '🚫', t: ptitle('allergies'), sub: t('q.allergies.s'), skip: t('q.allergies.skip'), body: ptabs() + pchips('allergies', ALLERGIES, tp().allergies) }),
  goal: () => ({ e: '🎯', t: ptitle('goal'), sub: t('q.goal.s'), body: solo() ? seg('p', 'goal', P0().goal, Object.entries(GOAL_E)) : pick1('goal', GOAL_E, ['none', 'lose', 'muscle', 'sugar', 'gentle']) }),
  loves: () => ({ e: '😍', t: ptitle('loves'), sub: t('q.loves.s'), skip: t('q.loves.skip'), body: ptabs() + pchips('loves', dishesFor(tp().diet), tp().loves) }),
  hates: () => ({ e: '🤢', t: ptitle('hates'), sub: t('q.hates.s'), skip: t('q.hates.skip'), body: ptabs() + pchips('hates', dishesFor(tp().diet), tp().hates) }),
  regions: () => ({ e: '🗺️', t: ptitle('regions'), sub: t('q.regions.s'), skip: t('q.regions.skip'), body: ptabs() + pchips('regions', REGIONS, tp().regions) }),
  brk: () => ({ e: '🌅', t: ptitle('brk'), sub: solo() ? t('q.brk.s', { n: nm() }) : t('g.brk.s'), body: pick1('brk', BRK_E, ['light', 'full', 'skip']) }),
  skill: () => ({ e: '👨‍🍳', t: t('q.skill.t'), sub: t('q.skill.s'), body: opts('h', 'skill', S.house.skill, SKILL_E, ['beginner', 'average', 'pro']) }),
  meals: () => ({ e: '🍽️', t: t('q.meals.t'), sub: t('q.meals.s'), ok: S.house.meals.length > 0, warn: t('q.meals.warn'), body: mealChips('hset', m => S.house.meals.includes(m), 'meals') }),
  time: () => ({ e: '⏱️', t: t('q.time.t'), sub: t('q.time.s'), body: seg('h', 'maxMin', S.house.maxMin, [[20, '⚡'], [30, '🕐'], [45, '🍲'], [60, '🥘'], [90, '🫕']], 'time') }),
  budget: () => ({ e: '💰', t: t('q.budget.t'), sub: t('q.budget.s'), body: opts('h', 'budget', S.house.budget, BUDGET_E, ['low', 'normal', 'high']) }),
  nv: () => ({ e: '🥬', t: t('q.nv.t'), sub: t('q.nv.s'), skip: t('q.nv.skip'), body: dayChips() }),
  repeat: () => ({ e: '🔁', t: t('q.repeat.t'), sub: t('q.repeat.s'), body: opts('h', 'repeat', S.house.repeat, { 3: '🔁', 7: '📅', 14: '🎲' }, [3, 7, 14]) }),
  notes: () => ({ e: '📝', t: t('q.notes.t'), sub: t('q.notes.s'), skip: t('q.notes.skip'),
    body: `<textarea class="cin" style="margin:0" data-bind="notes" aria-label="${esc(t('h.notes'))}" placeholder="${esc(t('q.notes.ph'))}">${esc(S.house.notes)}</textarea>` }),
  pantry: () => ({ e: '🧺', t: t('q.pantry.t'), sub: t('q.pantry.s'), body: pantryBody() }),
  key: () => ({ e: '🔑', t: t('q.key.t'), sub: t('q.key.s'), skip: t('q.key.skip'), body: provBox() }),
  done: () => ({ hero: true, cta: t('done.cta'), act: 'finish', body: `<div class="stackemo"><span>🎉</span></div><h1 class="hero-h tight">${t('q.done.t')}</h1>
    <div class="recap">
      <div class="card"><span>🧑‍🤝‍🧑</span><div><b>${S.people.map(p => p.emoji + ' ' + esc(p.name)).join('  ')}</b><small>${t(S.people.length > 1 ? 'done.pn' : 'done.p1', { n: S.people.length })}</small></div></div>
      <div class="card"><span>👨‍🍳</span><div><b>${t('done.cook', { skill: t('skill.' + S.house.skill), m: S.house.maxMin })}</b><small>${t('done.meals', { n: S.house.meals.length })}</small></div></div>
      <div class="card"><span>🧺</span><div><b>${t('done.pantry', { n: Object.values(S.inventory).filter(Boolean).length })}</b><small>${apiKey() ? t('done.keyok') : t('done.keyno')}</small></div></div>
    </div>` }),
};

function qView() {
  const id = Q[ui.qi], s = STEP[id]();
  const pct = Math.round(ui.qi / (Q.length - 1) * 100);
  const top = ui.qi > 0 && id !== 'done'
    ? `<div class="qtop"><button class="ico" data-act="qback" aria-label="${esc(t('back'))}">←</button><div class="qprog"><i style="width:${pct}%"></i></div><span class="qn">${pct}%</span></div>` : '<div class="qtop"></div>';
  const inner = s.hero
    ? `<div class="qscroll hero"><div class="herobox ${ui.anim ? 'in' : ''}">${s.body}</div></div>`
    : `<div class="qscroll"><div class="${ui.anim ? 'in' : ''}">${SEC_OF[id] ? `<div class="qsec">${SEC_E[SEC_OF[id]]} ${t('sec.' + SEC_OF[id])}</div>` : ''}<div class="qe">${s.e}</div><h1 class="qt">${s.t}</h1>${s.sub ? `<p class="sub">${s.sub}</p>` : ''}${s.body}</div></div>`;
  const foot = s.foot || `<button class="btn big" data-act="${s.act || 'qnext'}">${s.cta || t('continue')}</button>${s.skip ? `<button class="btn ghost" data-act="qnext" data-skip="1">${s.skip}</button>` : ''}`;
  return `<div class="q">${top}${inner}<div class="qfoot">${foot}</div></div>`;
}

function qgo(i) {
  ui.qi = i; ui.tab = 0; ui.anim = true; render(); ui.anim = false; scrollTo(0, 0);
  [...document.querySelectorAll('.qscroll [data-bind=pname]')].find(x => !x.value)?.focus({ preventScroll: true });
}
const qStep = d => { let i = ui.qi + d; while (HIDE[Q[i]]?.()) i += d; return Math.max(0, Math.min(Q.length - 1, i)); };

function qnext(skip) {
  const id = Q[ui.qi], s = STEP[id]();
  if (!skip && s.ok === false) return toast(s.warn);
  if (id === 'welcome' && !S.people.length) S.people.push(newPerson());
  if (id === 'names') { S.people = S.people.filter(p => p.name.trim()).map(p => ({ ...p, name: p.name.trim() })); save(); buzz(); } // drop blank rows
  qgo(qStep(1));
}
const qback = () => qgo(qStep(-1));

/* ---------- today / cart ---------- */
function optCard(m, o, i, p) {
  const on = p.pick[m] === i, miss = missingOf(o);
  const he = S.history.find(x => x.date === today() && x.meal === m);
  return `<article class="opt ${on ? 'on' : ''} ${p.pick[m] != null && !on ? 'dim' : ''}">
    <button class="optmain" data-act="pick" data-m="${m}" data-i="${i}" aria-pressed="${on}"><span class="emo">${esc(o.emoji)}</span><span class="otxt"><strong class="oname">${esc(o.dish)}</strong><span class="owhy">${esc(o.why)}</span>
    <span class="tags">${miss.length ? `<span class="tag need">${t('tag.need', { items: esc(miss.join(', ')) })}</span>` : `<span class="tag ok">${t('tag.ready')}</span>`}<span class="tag">⏱ ${t('unit.min', { n: o.minutes })}</span></span></span></button>
    ${on ? `<div class="rate">${t('rate.q')}<button data-act="rate" data-m="${m}" data-v="1" class="${he?.rating === 1 ? 'on' : ''}" aria-label="${esc(t('rate.good'))}">👍</button><button data-act="rate" data-m="${m}" data-v="-1" class="${he?.rating === -1 ? 'on bad' : ''}" aria-label="${esc(t('rate.bad'))}">👎</button></div>` : ''}</article>`;
}

function todayView() {
  const p = planned(), D = new Date(), am = activeMeals();
  const hr = D.getHours(); // read per render, not at load: an open PWA outlives the morning
  const g = t(hr < 5 ? 'greet.late' : hr < 12 ? 'greet.morning' : hr < 17 ? 'greet.afternoon' : hr < 21 ? 'greet.evening' : 'greet.night');
  const picks = pickedOpts().length, total = p ? Object.keys(p.meals).length : 0;
  const sel = am.filter(m => ui.meals[m]);
  return `<div class="brandbar">${logo('row sm')}<button class="ico themebtn" data-act="flip" aria-label="${esc(t('theme.flip'))}">${effective() === 'dark' ? '☀️' : '🌙'}</button></div>
  <div class="greet">${g}<small>${dateLabel(D)} · ${t('today.hungry')}</small></div>
  <div class="meals-pick"><div class="chips">${am.map(m => chip('tm', `data-m="${m}"`, `${MEALS[m]} ${mealName(m)}`, ui.meals[m])).join('')}</div></div>
  ${!apiKey() ? `<div class="card nudge"><div class="big-e">🔑</div><h3>${t('nudge.t')}</h3><p class="sub">${t('nudge.s')}</p><button class="btn" data-act="gokey">${t('nudge.btn')}</button></div>` :
    `<button class="btn big" data-act="plan" ${!sel.length || ui.loading ? 'disabled' : ''}>${p ? t('today.again') : t('today.plan')}</button>`}
  ${total ? `<div class="progress"><i style="width:${picks / total * 100}%"></i></div><div class="pl">${picks === total ? t('prog.all') : t('prog.n', { a: picks, b: total })}</div>` : ''}
  ${am.map(m => {
    const head = `<div class="meal-h"><h2>${mealName(m)}</h2><span class="hi">${t('meal.' + m + '.s')}</span>`;
    if (ui.loading?.includes(m)) return `<section class="meal">${head}</div>${'<div class="sk"></div>'.repeat(3)}<div class="lmsg" id="lmsg">${loadingLine()}</div></section>`;
    const list = p?.meals[m]; if (!list) return '';
    return `<section class="meal">${head}${p.pick[m] != null ? `<span class="pill">${t('pill.locked')}</span>` : ''}</div>
      ${list.map((o, i) => optCard(m, o, i, p)).join('')}
      <button class="btn sm reroll" data-act="reroll" data-m="${m}" ${ui.loading ? 'disabled' : ''}>${t('btn.reroll')}</button></section>`;
  }).join('')}
  ${picks ? `<div class="cookbar"><button class="btn violet" data-act="cook">${t('btn.cook')}</button></div>` : ''}`;
}

function cartView() {
  const items = cartItems(), any = pickedOpts().length;
  return `<section class="sec"><h2>${t('cart.t')}</h2><p class="sub">${t('cart.s')}</p>
  ${items.length ? items.map(i => `<button class="item" data-act="bought" data-v="${esc(i)}"><span></span>${esc(i)}</button>`).join('') + `<button class="btn lime" style="width:100%;margin-top:18px" data-act="shareCart">${t('cart.share')}</button>` :
    `<div class="empty"><div class="big-e">${any ? '🎉' : '🥡'}</div><h3>${any ? t('cart.none.t') : t('cart.empty.t')}</h3><p class="sub">${any ? t('cart.none.s') : t('cart.empty.s')}</p></div>`}</section>`;
}

const houseView = () => `${peopleSec()}${houseSec()}${keySec()}${langSec()}${themeSec()}<section class="sec"><button class="btn ghost danger" data-act="reset">${t('reset.btn')}</button></section><p class="credit">Emoji art: <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noopener">Twemoji</a> (CC-BY 4.0)</p>`;

const TABS = [['today', '🍽️', 'tab.today'], ['pantry', '🧺', 'tab.pantry'], ['cart', '🛒', 'tab.order'], ['house', '🏠', 'tab.house']];
const tabs = () => TABS.map(([v, e, k]) => `<button class="${ui.view === v ? 'on' : ''}" data-act="go" data-v="${v}" aria-label="${esc(t(k))}"><b>${e}</b>${t(k)}${v === 'cart' && cartItems().length ? `<span class="badge">${cartItems().length}</span>` : ''}</button>`).join('');

function render() {
  const y = scrollY, v = ui.view, sc = $('.qscroll')?.scrollTop;
  $('#app').classList.toggle('onb', v === 'q');
  $('#app').innerHTML = v === 'q' ? qView() : { today: todayView, pantry: pantryView, cart: cartView, house: houseView }[v]();
  $('#tabs').innerHTML = v === 'q' ? '' : tabs();
  const n = $('.qscroll'); if (n && sc && !ui.anim) n.scrollTop = sc; // keep the pantry step where it was after a tap
  scrollTo(0, y);
}

/* ---------- flatmate dialog (edit from House tab) ---------- */
const dlg = $('#dlg');
function openPerson(i) {
  ui.draftIdx = i;
  ui.draft = i >= 0 ? { ...newPerson(), ...structuredClone(S.people[i]) } : newPerson();
  drawPerson(); dlg.showModal();
}
const dchips = (f, list) => pchips(f, list, ui.draft[f]);
function drawPerson() {
  const P = ui.draft;
  dlg.innerHTML = `<div class="dbody"><h2>${t(ui.draftIdx >= 0 ? 'dlg.edit' : 'dlg.new')}</h2>
  <label class="l">${t('dlg.name')}</label><input class="cin solid" data-bind="pname" value="${esc(P.name)}" placeholder="${esc(t('name.ph'))}" autocomplete="off">
  <label class="l">${t('dlg.avatar')}</label><div class="avs">${AVATARS.map(a => `<span class="av ${P.emoji === a ? 'on' : ''}" data-act="pk" data-f="emoji" data-v="${a}">${a}</span>`).join('')}</div>
  <label class="l">${t('dlg.diet')}</label>${single(['veg', 'egg', 'nonveg', 'jain'], P.diet, 'pk', 'diet', dietLabel)}
  <label class="l">${t('dlg.spice')}: <span id="sp">${'🌶️'.repeat(P.spice)}</span></label><input type="range" min="1" max="5" value="${P.spice}" data-bind="spice" aria-label="${esc(t('dlg.spice'))}">
  <label class="l">${t('dlg.goal')}</label>${single(['none', 'lose', 'muscle', 'sugar', 'gentle'], P.goal, 'pk', 'goal', goalLabel)}
  <label class="l">${t('dlg.brk')}</label>${single(['light', 'full', 'skip'], P.brk, 'pk', 'brk', k => `${BRK_E[k]} ${t('brk.' + k)}`)}
  <label class="l">${t('dlg.allergy')}</label>${dchips('allergies', ALLERGIES)}
  <label class="l">${t('dlg.loves')}</label>${dchips('loves', dishesFor(P.diet))}
  <label class="l">${t('dlg.hates')}</label>${dchips('hates', dishesFor(P.diet))}
  <label class="l">${t('dlg.grew')}</label>${dchips('regions', REGIONS)}
  ${ui.draftIdx >= 0 ? `<button class="btn ghost danger" data-act="pdel">${t('dlg.remove')}</button>` : ''}</div>
  <div class="dfoot"><button class="btn ghost" data-act="pcancel">${t('dlg.cancel')}</button><button class="btn" data-act="psave">${t('dlg.save')}</button></div>`;
}
const redrawPerson = () => { const sy = $('.dbody')?.scrollTop || 0; drawPerson(); $('.dbody').scrollTop = sy; };

/* ---------- events ---------- */
const go = v => { ui.view = v; render(); scrollTo(0, 0); };
const SCALAR = ['spice', 'maxMin', 'repeat'];
const ARRAYS = ['nvOff', 'meals'];

// a dish can't be both loved and hated: picking it in one list removes it from the other
const unTangle = (P, f, v) => { const other = { loves: 'hates', hates: 'loves' }[f]; if (other && P[f].includes(v)) P[other] = P[other].filter(x => x !== v); };

const acts = {
  go: d => go(d.v),
  qnext: d => qnext(!!d.skip),
  qback,
  lang: async d => { S.lang = d.v; save(); await setLang(d.v); wi = WORDS.findIndex(l => l.c === d.v); render(); },
  qpick: d => {
    (d.t === 'p' ? P0() : S.house)[d.f] = SCALAR.includes(d.f) ? +d.v : d.v; save();
    const at = ui.qi; render();
    setTimeout(() => ui.qi === at && qnext(), 240); // single-select: auto-advance
  },
  qset: d => { (d.t === 'p' ? P0() : S.house)[d.f] = SCALAR.includes(d.f) ? +d.v : d.v; save(); render(); }, // compact pickers: set, stay on the page
  cat: d => { ui.cat = ui.cat === d.v ? '' : d.v; render(); },
  more: d => { ui.more[d.f] = !ui.more[d.f]; ui.view === 'q' ? render() : redrawPerson(); },
  gset: d => { S.people[+d.i][d.f] = SCALAR.includes(d.f) ? +d.v : d.v; save(); render(); }, // group page: one chip row per flatmate, no auto-advance
  ptab: d => { ui.tab = +d.i; render(); },
  cycleAv: d => { const p = S.people[+d.i]; p.emoji = AVATARS[(AVATARS.indexOf(p.emoji) + 1) % AVATARS.length]; save(); render(); },
  addRow: () => { S.people.push(newPerson()); render(); const ins = document.querySelectorAll('[data-bind=pname]'); ins[ins.length - 1].focus(); ins[ins.length - 1].scrollIntoView({ block: 'nearest' }); },
  delP: d => { S.people.splice(+d.i, 1); save(); render(); },
  finish: () => { S.done = true; save(); go('today'); confetti(innerWidth / 2, innerHeight / 3, 120); buzz([20, 40, 20]); },
  gokey: () => { go('house'); $('#aisec')?.scrollIntoView({ block: 'start' }); }, // from the Today nudge: land on the key, not the top of Settings
  prov: d => { S.provider = d.v; save(); render(); },
  theme: d => { S.theme = d.v; save(); applyTheme(); render(); },
  flip: () => { S.theme = effective() === 'dark' ? 'light' : 'dark'; save(); applyTheme(); render(); },
  addP: () => openPerson(-1),
  editP: d => openPerson(+d.i),
  pcancel: () => dlg.close(),
  psave: () => {
    if (!ui.draft.name.trim()) return toast(t('q.name.warn'));
    ui.draftIdx >= 0 ? (S.people[ui.draftIdx] = ui.draft) : S.people.push(ui.draft);
    save(); dlg.close(); render(); buzz();
  },
  pdel: () => { S.people.splice(ui.draftIdx, 1); save(); dlg.close(); render(); },
  pk: d => {
    const P = ui.view === 'q' ? tp() : ui.draft, f = d.f;
    if (Array.isArray(P[f])) P[f] = P[f].includes(d.v) ? P[f].filter(x => x !== d.v) : [...P[f], d.v];
    else P[f] = d.v;
    unTangle(P, f, d.v);
    if (ui.view === 'q') { save(); return render(); }
    redrawPerson();
  },
  hset: d => {
    const H = S.house;
    if (ARRAYS.includes(d.f)) H[d.f] = H[d.f].includes(d.v) ? H[d.f].filter(x => x !== d.v) : [...H[d.f], d.v];
    else H[d.f] = SCALAR.includes(d.f) ? +d.v : d.v;
    save(); render();
  },
  inv: d => { S.inventory[d.v] = !S.inventory[d.v]; save(); render(); },
  stock: d => { for (const c of PANTRY) for (const i of c.items) S.inventory[i] = d.v === '1'; for (const i of S.custom) S.inventory[i] = d.v === '1'; save(); render(); },
  tm: d => { ui.meals[d.m] = !ui.meals[d.m]; render(); },
  plan: () => plan(activeMeals().filter(m => ui.meals[m])),
  reroll: d => plan([d.m], (planned()?.meals[d.m] || []).map(o => o.dish)),
  pick: (d, e) => {
    const p = planned(), m = d.m, i = +d.i, dish = p.meals[m][i].dish;
    S.history = S.history.filter(x => !(x.date === today() && x.meal === m));
    if (p.pick[m] === i) delete p.pick[m];
    else {
      p.pick[m] = i; S.history.push({ date: today(), meal: m, dish, rating: 0 });
      const all = Object.keys(p.meals).every(k => p.pick[k] != null);
      const r = e.target.closest('.opt').getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top + 30, all ? 140 : 40); buzz(all ? [20, 40, 20] : 15);
      if (all) toast(t('toast.locked'));
    }
    S.history = S.history.slice(-90); save(); render();
  },
  rate: d => {
    const he = S.history.find(x => x.date === today() && x.meal === d.m);
    if (he) { he.rating = he.rating === +d.v ? 0 : +d.v; save(); render(); if (he.rating === 1) confetti(innerWidth / 2, innerHeight / 2, 25); }
  },
  bought: d => { S.inventory[d.v] = true; save(); render(); toast(t('toast.bought', { item: cap(d.v) })); buzz(); },
  shareCart: () => share(t('share.head') + '\n' + cartItems().map(i => '• ' + cap(i)).join('\n')),
  cook: () => {
    const picks = pickedOpts(), miss = cartItems();
    share(`${t('cook.head')}\n` + picks.map(([m, o]) => `${MEALS[m]} ${mealName(m)}: ${o.dish}`).join('\n') +
      (miss.length ? `\n\n${t('cook.miss', { items: miss.join(', ') })}` : '') + `\n${t('cook.thanks')}`);
  },
  reset: () => { if (confirm(t('reset.confirm'))) { const l = S.lang; localStorage.removeItem(KEY); S = { ...blank(), lang: l }; ui.view = 'q'; ui.qi = 0; applyTheme(); render(); } },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && acts[el.dataset.act]) acts[el.dataset.act](el.dataset, e);
  else if (e.target === dlg) dlg.close(); // backdrop tap
});
document.addEventListener('keydown', e => {
  const el = e.target;
  if (e.key === 'Enter' && el.classList.contains('cin') && el.tagName === 'INPUT' && el.dataset.f) {
    const v = el.value.trim().toLowerCase(); if (!v) return;
    if (el.dataset.f === 'pantry') {
      if (![...PANTRY.flatMap(c => c.items), ...S.custom].includes(v)) S.custom.push(v);
      S.inventory[v] = true; save(); render(); $('.cin[data-f=pantry]').focus();
    } else {
      const f = el.dataset.f, val = f === 'regions' ? el.value.trim() : cap(el.value.trim()), P = ui.view === 'q' ? tp() : ui.draft;
      if (!P[f].includes(val)) P[f].push(val);
      unTangle(P, f, val);
      if (ui.view === 'q') { save(); render(); $(`.cin[data-f=${f}]`).focus(); return; }
      redrawPerson(); dlg.querySelector(`.cin[data-f=${f}]`).focus();
    }
  } else if (e.key === 'Enter' && el.dataset.bind === 'pname' && ui.view === 'q') {
    // Enter on a name: next row (a new one if this is the last), like a list of contacts
    const i = +el.dataset.i; if (!el.value.trim()) return;
    if (i === S.people.length - 1 && S.people.length < 8) acts.addRow(); else document.querySelectorAll('[data-bind=pname]')[i + 1]?.focus();
  }
});
document.addEventListener('input', e => {
  const el = e.target, b = el.dataset.bind; if (!b) return;
  if (b === 'pname') { const inOnboarding = el.dataset.i !== undefined; (inOnboarding ? S.people[+el.dataset.i] : ui.draft).name = el.value; if (inOnboarding) save(); }
  else if (b === 'spiceSolo') {
    const n = +el.value; P0().spice = n; save();
    $('#sbig').textContent = spiceFace(n); $('#sname').textContent = t('spice.' + n); $('#sdesc').textContent = t(`spice.${n}.d`);
  } else if (b === 'spice') { ui.draft.spice = +el.value; $('#sp').textContent = '🌶️'.repeat(+el.value); }
  else if (b === 'notes') { S.house.notes = el.value; save(); }
  else if (b === 'apiKey') { S.keys[S.provider] = el.value.trim(); save(); }
  else if (b === 'model') { el.value.trim() ? (S.models[S.provider] = el.value.trim()) : delete S.models[S.provider]; save(); }
});

(async function boot() {
  if (!S.lang) S.lang = detectLang();
  await setLang(S.lang);
  wi = Math.max(0, WORDS.findIndex(l => l.c === S.lang));
  loadWordFonts(); applyTheme();
  render(); ui.anim = false;
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(tickLogo, 2300);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
