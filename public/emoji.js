// Replaces every emoji in the page with a bundled SVG (Twemoji artwork, CC-BY 4.0; see README).
// Why: system emoji look different on every OS, and newer ones (🫓 🫘 🫶 🫕 🧑‍🍳) render as empty boxes on older Android.
// A MutationObserver handles everything the app renders later (screens, toasts, dialogs) before the browser paints.
const RE = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}️?)*/gu;
const SKIP = /^(SCRIPT|STYLE|TEXTAREA|OPTION|TITLE)$/;
const code = s => [...s].map(c => c.codePointAt(0).toString(16)).filter(c => c !== 'fe0f').join('-');

function swap(node) {
  const t = node.nodeValue;
  if (!t || !node.parentElement || SKIP.test(node.parentElement.tagName)) return;
  const hits = [...t.matchAll(RE)];
  if (!hits.length) return;
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of hits) {
    if (m.index > last) frag.append(t.slice(last, m.index));
    const img = new Image();
    img.className = 'emj'; img.alt = m[0]; img.draggable = false; img.decoding = 'async';
    img.src = `emoji/${code(m[0])}.svg`;
    frag.append(img);
    last = m.index + m[0].length;
  }
  if (last < t.length) frag.append(t.slice(last));
  node.replaceWith(frag);
}

function walk(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), found = [];
  while (w.nextNode()) found.push(w.currentNode);
  found.forEach(swap);
}

// no bundled file for this emoji? fall back to the system glyph instead of a broken image
document.addEventListener('error', e => {
  const el = e.target;
  if (el.tagName === 'IMG' && el.classList.contains('emj')) el.replaceWith(document.createTextNode(el.alt));
}, true);

new MutationObserver(list => {
  for (const m of list) for (const n of m.addedNodes) n.nodeType === 3 ? swap(n) : n.nodeType === 1 && walk(n);
}).observe(document.body, { childList: true, subtree: true });
walk(document.body);
