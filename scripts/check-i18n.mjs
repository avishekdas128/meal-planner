// Validates every language file against the English master:
//   node scripts/check-i18n.mjs
// Fails (exit 1) on unknown keys, mismatched {placeholders}, or unbalanced <em> tags.
// Keys missing from a language are allowed: they fall back to English at runtime (that's how
// loanwords like "Pantry" stay English on purpose) and are only listed for information.
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../public/lang/', import.meta.url));
const load = async c => (await import(pathToFileURL(dir + c + '.js').href)).default;
const en = await load('en');
const ph = s => (s.match(/\{\w+\}/g) || []).sort().join(',');
const count = (s, re) => (s.match(re) || []).length;

let problems = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'en.js').sort()) {
  const c = f.slice(0, -3), d = await load(c);
  const unknown = Object.keys(d).filter(k => !(k in en));
  const badPh = Object.keys(d).filter(k => k in en && ph(d[k]) !== ph(en[k]));
  const badEm = Object.keys(d).filter(k => count(d[k], /<em>/g) !== count(d[k], /<\/em>/g));
  const fallback = Object.keys(en).filter(k => !(k in d));
  problems += unknown.length + badPh.length + badEm.length;
  console.log(`${c.padEnd(3)} ${String(Object.keys(d).length).padStart(3)} keys | unknown: ${unknown.join(' ') || '-'} | placeholder mismatch: ${badPh.join(' ') || '-'} | unbalanced <em>: ${badEm.join(' ') || '-'} | falls back to English: ${fallback.length}`);
}
console.log(problems ? `\n${problems} problem(s)` : '\nAll language files are structurally valid.');
process.exit(problems ? 1 : 0);
