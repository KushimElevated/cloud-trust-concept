import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const DIRECTORIES = ['dist', 'scripts', 'tests'];
const EXCLUDED = new Set(['FILE_MANIFEST.json']);

async function listFiles(relative = '') {
  const entries = await readdir(new URL(relative || '.', root), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) { if (relative || DIRECTORIES.includes(entry.name)) files.push(...await listFiles(path)); }
    else if (entry.isFile() && !EXCLUDED.has(path) && !path.endsWith('.zip')) files.push(path);
  }
  return files;
}

export async function buildManifest() {
  const { version } = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  const files = [];
  for (const path of (await listFiles()).sort()) {
    const content = await readFile(new URL(path, root));
    files.push({ path, bytes: content.length, sha256: createHash('sha256').update(content).digest('hex') });
  }
  return `${JSON.stringify({ product: 'Cloud Trust', version, files }, null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await writeFile(new URL('FILE_MANIFEST.json', root), await buildManifest());
  console.log(`File manifest written to ${fileURLToPath(new URL('FILE_MANIFEST.json', root))}.`);
}
