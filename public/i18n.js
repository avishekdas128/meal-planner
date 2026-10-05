import en from './lang/en.js';

// English + the 7 most-spoken Indian languages by census speakers (Urdu skipped: needs RTL layout).
// w = the word for "food/meal" that animates in the logo, lw = the word "language".
export const LANGS = [
  { c: 'en', n: 'English', e: 'English', w: 'Khana', lw: 'Language' },
  { c: 'hi', n: 'हिन्दी', e: 'Hindi', w: 'खाना', lw: 'भाषा' },
  { c: 'bn', n: 'বাংলা', e: 'Bengali', w: 'খাবার', lw: 'ভাষা', font: 'Noto Sans Bengali' },
  { c: 'mr', n: 'मराठी', e: 'Marathi', w: 'जेवण', lw: 'भाषा' },
  { c: 'te', n: 'తెలుగు', e: 'Telugu', w: 'భోజనం', lw: 'భాష', font: 'Noto Sans Telugu' },
  { c: 'ta', n: 'தமிழ்', e: 'Tamil', w: 'சாப்பாடு', lw: 'மொழி', font: 'Noto Sans Tamil' },
  { c: 'gu', n: 'ગુજરાતી', e: 'Gujarati', w: 'ભોજન', lw: 'ભાષા', font: 'Noto Sans Gujarati' },
  { c: 'kn', n: 'ಕನ್ನಡ', e: 'Kannada', w: 'ಊಟ', lw: 'ಭಾಷೆ', font: 'Noto Sans Kannada' },
];
// logo cycle: all the Indian-language words, then Roman "Khana"
export const WORDS = [...LANGS.slice(1), LANGS[0]];

// Devanagari + Latin come from Yatra One / Mukta (loaded in index.html); other scripts get a Noto family
export const fontOf = l => (l.font ? `'${l.font}'` : "'Yatra One'");
export const weightOf = l => (l.font ? 700 : 400);

let dict = {}, cur = LANGS[0];
export const lang = () => cur;
export const t = (k, v) => {
  const s = dict[k] ?? en[k] ?? k;
  return v ? s.replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '') : s;
};

const link = (id, href) => {
  if (document.getElementById(id)) return;
  const l = document.createElement('link');
  Object.assign(l, { id, rel: 'stylesheet', href });
  document.head.append(l);
};
const fam = (f, w) => `family=${f.replace(/ /g, '+')}:wght@${w}`;

// tiny glyph-subset of every script, so the language picker and the animated logo render at once
export function loadWordFonts() {
  const text = encodeURIComponent(LANGS.map(l => l.w + l.n + l.lw).join(''));
  const fams = LANGS.filter(l => l.font).map(l => fam(l.font, '600;700')).join('&');
  link('wf', `https://fonts.googleapis.com/css2?${fams}&text=${text}&display=swap`);
}

export async function setLang(c) {
  const l = LANGS.find(x => x.c === c) || LANGS[0];
  try { dict = l.c === 'en' ? {} : (await import(`./lang/${l.c}.js`)).default; } catch { dict = {}; }
  cur = l;
  const root = document.documentElement;
  root.lang = l.c;
  if (l.font) link('ff-' + l.c, `https://fonts.googleapis.com/css2?${fam(l.font, '400;500;600;700')}&display=swap`);
  root.style.setProperty('--script', l.font ? `'${l.font}'` : "'Mukta'");
  root.style.setProperty('--hw', l.font ? '700' : '400');
}

// weekday / date names come from the browser's own locale data
const loc = () => `${cur.c}-IN`;
const fmt = (o, d) => { try { return new Intl.DateTimeFormat(loc(), o).format(d); } catch { return new Intl.DateTimeFormat('en-IN', o).format(d); } };
export const dayLabel = (i, style = 'short') => fmt({ weekday: style, timeZone: 'UTC' }, new Date(Date.UTC(2024, 0, 7 + i))); // 7 Jan 2024 = Sunday
export const dateLabel = d => fmt({ weekday: 'long', day: 'numeric', month: 'short' }, d);
