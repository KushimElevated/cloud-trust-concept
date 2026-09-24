import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildGuideMarkdown, PLAYBOOKS, TOOLS} from '../dist/implementation-data.mjs';
import {buildManifest} from '../scripts/build-manifest.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('the downloadable guide matches the in-product guide data',async()=>{
  assert.equal(await read('dist/cloud-trust-implementation.md'),buildGuideMarkdown(),'Run npm run export-guide after editing dist/implementation-data.mjs.');
});

test('every playbook references known tools and every tool links to official https sources',()=>{
  const tools=new Set(TOOLS.map(t=>t.id)),pillars=new Set(PLAYBOOKS.map(p=>p.id));
  assert.equal(tools.size,TOOLS.length,'tool identifiers are unique');
  for(const p of PLAYBOOKS)for(const id of p.tools)assert.ok(tools.has(id),`${p.id} references unknown tool ${id}`);
  for(const t of TOOLS){
    assert.ok(t.pillars.length&&t.pillars.every(id=>pillars.has(id)),`${t.id} maps to known pillars`);
    assert.ok(t.sources.length,`${t.id} has sources`);
    for(const [,url] of t.sources)assert.match(url,/^https:\/\//,`${t.id} source ${url}`);
  }
});

test('the file manifest lists every packaged file with its current size and hash',async()=>{
  assert.equal(await read('FILE_MANIFEST.json'),await buildManifest(),'Run npm run manifest after changing packaged files.');
  assert.equal(JSON.parse(await read('FILE_MANIFEST.json')).version,JSON.parse(await read('package.json')).version);
});
