import { writeFile } from 'node:fs/promises';
import { buildGuideMarkdown } from '../dist/implementation-data.mjs';
await writeFile(new URL('../dist/cloud-trust-implementation.md',import.meta.url),buildGuideMarkdown());
console.log('Implementation guide exported.');
