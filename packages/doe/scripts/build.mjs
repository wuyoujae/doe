import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'rolldown';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const repo = path.resolve(root, '../..');
export const defaultOutput = path.join(root, '.cache/runtime');

export async function compileRuntime({ sourcemap = true, sourceOverrides = new Map() } = {}) {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'architecture/runtime-manifest.json'), 'utf8'));
  const sourceModules = new Set();
  const readSource = file => sourceOverrides.has(path.resolve(file)) ? Promise.resolve(Buffer.from(sourceOverrides.get(path.resolve(file)))) : fs.readFile(file);
  const assets = new Map();
  // Separate classic-script entries preserve the original registration order and realm boundaries.
  // All executable inputs and assets below belong to app/doe, never the baseline application.
  for (const script of manifest.scripts) {
    const result = await build({ input: path.join(root, script.entry), write: false, platform: 'browser',
      plugins: sourceOverrides.size ? [{ name: 'isolated-source-overrides', load(id) { return sourceOverrides.get(path.resolve(id)); } }] : [],
      output: { file: script.url.slice(1), format: 'iife', name: '__DOE_' + path.basename(path.dirname(script.entry)).replaceAll('-', '_'), sourcemap, minify: false } });
    for (const chunk of result.output) {
      if (chunk.type === 'chunk') for (const id of Object.keys(chunk.modules)) sourceModules.add(id);
      const url = path.posix.join(path.posix.dirname(script.url), chunk.fileName);
      assets.set(url, Buffer.from(chunk.type === 'chunk' ? chunk.code : chunk.source));
    }
  }
  for (const resource of manifest.resources) {
    if (resource.segments) {
      // Preserve the exact cascade order across component-owned stylesheet modules.
      const pieces = await Promise.all(resource.segments.map(segment => readSource(path.join(root, segment.path))));
      assets.set(resource.url, Buffer.concat(pieces));
    } else {
      assets.set(resource.url, await readSource(path.join(root, resource.path)));
    }
  }
  return { assets, report: { scripts: manifest.scripts.length, modules: sourceModules.size, originalSourceUnits: manifest.units.length, resources: manifest.resources.length } };
}

export async function buildRuntime(outDir = defaultOutput, options = {}) {
  const compiled = await compileRuntime(options);
  for (const [url, source] of compiled.assets) {
    const file = path.join(outDir, url);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, source);
  }
  const report = { ...compiled.report, outDir };
  await fs.writeFile(path.join(outDir, 'build.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await buildRuntime(process.argv[2] ? path.resolve(process.argv[2]) : undefined)));
}
