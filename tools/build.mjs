// Bundles index.html + src/ + story/ into one self-contained file, dist/fourth-floor.html,
// which opens by double-click (browsers refuse ES module imports over file://).
// A tiny module registry: each file becomes a function that returns its exports.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entry = join(root, 'src/main.js');

const order = [];
const seen = new Set();
const IMPORT_RE = /^import\s+(?:(\*\s+as\s+\w+)|(\w+)|\{([^}]*)\})\s+from\s+'([^']+)';?\s*$/gm;

function visit(file) {
  if (seen.has(file)) return;
  seen.add(file);
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(IMPORT_RE)) visit(resolve(dirname(file), m[4]));
  order.push(file);
}
visit(entry);

const id = f => relative(root, f);

function transform(file) {
  let src = readFileSync(file, 'utf8');
  const exportsList = [];
  src = src.replace(IMPORT_RE, (_, star, def, names, spec) => {
    const dep = JSON.stringify(id(resolve(dirname(file), spec)));
    if (star) return `const ${star.replace(/\*\s+as\s+/, '')} = __req(${dep});`;
    if (def) return `const ${def} = __req(${dep}).default;`;
    const parts = names.split(',').map(s => s.trim()).filter(Boolean).map(s => s.replace(/\s+as\s+/, ': '));
    return `const { ${parts.join(', ')} } = __req(${dep});`;
  });
  src = src.replace(/^export\s+default\s+/m, 'const __default = ');
  if (src.includes('const __default = ')) exportsList.push('default: __default');
  src = src.replace(/^export\s+((?:async\s+)?function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)/gm, (_, kind, name) => {
    exportsList.push(name);
    return `${kind} ${name}`;
  });
  if (/^\s*export\s/m.test(src)) throw new Error(`unsupported export form in ${id(file)}`);
  return `__def(${JSON.stringify(id(file))}, () => {\n${src}\nreturn { ${exportsList.join(', ')} };\n});`;
}

const runtime = `const __mods = {}, __cache = {};
function __def(name, fn) { __mods[name] = fn; }
function __req(name) { if (!(name in __cache)) { if (!__mods[name]) throw new Error('missing module ' + name); __cache[name] = __mods[name](); } return __cache[name]; }`;

const bundle = `${runtime}\n${order.map(transform).join('\n')}\n__req(${JSON.stringify(id(entry))});`;

let html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'src/style.css'), 'utf8');
html = html.replace('<link rel="stylesheet" href="src/style.css">', () => `<style>\n${css}\n</style>`);
html = html.replace('<script type="module" src="src/main.js"></script>', () => `<script>\n(() => {\n${bundle.replace(/<\/script/gi, '<\\/script')}\n})();\n</script>`);
if (html.includes('<script type="module"') || html.includes('href="src/style.css"')) throw new Error('entry tags not replaced');

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/fourth-floor.html'), html);
console.log(`dist/fourth-floor.html  ${(html.length / 1024).toFixed(0)} KB  (${order.length} modules)`);
