import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = join(root, 'node_modules', 'heroicons', '24', 'outline');
const dest = join(root, 'assets', 'icons');

if (!existsSync(src)) {
  console.error('heroicons not found in node_modules. Run npm install first.');
  process.exit(1);
}

// Ensure destination directory exists
mkdirSync(dest, { recursive: true });

// Copy all SVGs, adding width/height if missing, and collect keys
const files = readdirSync(src).filter((f) => f.endsWith('.svg')).sort();
const keys = [];

for (const file of files) {
  let svg = readFileSync(join(src, file), 'utf8');

  // Add width="24" height="24" after viewBox if not already present
  if (!svg.match(/(?<!-)width\s*=/i)) {
    svg = svg.replace(/(viewBox="[^"]*")/, '$1 width="24" height="24"');
  }

  writeFileSync(join(dest, file), svg);
  keys.push(basename(file, '.svg'));
}

// Write manifest
writeFileSync(join(dest, 'manifest.json'), JSON.stringify(keys, null, 2));

console.log(`Bundled ${keys.length} icons to assets/icons/`);
