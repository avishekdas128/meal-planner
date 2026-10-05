// Bundles the Twemoji artwork for exactly the emoji this app uses:
//   node scripts/build-emoji.mjs
// It scans the source for emoji (UI strings, translations) plus the allowed dish emoji, downloads each SVG
// into public/emoji/, and writes public/emoji/list.json (the service worker precaches that list).
// Artwork: Twemoji by Twitter / the jdecked fork, licensed CC-BY 4.0 (https://github.com/jdecked/twemoji).
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const pub = fileURLToPath(new URL('../public/', import.meta.url));
const out = pub + 'emoji/';
fs.mkdirSync(out, { recursive: true });

const RE = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}️?)*/gu;
const files = ['app.js', 'data.js', ...fs.readdirSync(pub + 'lang').map(f => 'lang/' + f)];
const found = new Set(files.flatMap(f => fs.readFileSync(pub + f, 'utf8').match(RE) || []));
const { DISH_EMOJI } = await import(pathToFileURL(pub + 'data.js').href);
DISH_EMOJI.forEach(e => found.add(e));

const code = s => [...s].map(c => c.codePointAt(0).toString(16)).filter(c => c !== 'fe0f').join('-');
const base = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/';
const done = new Set(), missing = [];
for (const e of found) {
  const name = code(e) + '.svg', dest = out + name;
  if (fs.existsSync(dest)) { done.add(name); continue; }
  const r = await fetch(base + name);
  if (!r.ok) { missing.push(`${e} (${name})`); continue; }
  fs.writeFileSync(dest, await r.text());
  done.add(name);
}
const list = [...done].sort();
fs.writeFileSync(out + 'list.json', JSON.stringify(list));
console.log(`${list.length} emoji bundled, ${missing.length} missing${missing.length ? ': ' + missing.join(', ') : ''}`);
process.exit(missing.length ? 1 : 0);
