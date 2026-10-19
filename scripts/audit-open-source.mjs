import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', ['-C', root, ...args], {
  encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
});
const files = [...new Set(git('ls-files', '-z', '--cached', '--others', '--exclude-standard')
  .split('\0').filter(Boolean))].sort();
const findings = [];
const manifest = [];
const rules = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ['provider-key', /\b(?:sk-(?:proj-|or-v1-)?[A-Za-z0-9_-]{32,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,}|AKIA[A-Z0-9]{16}|xox[baprs]-[A-Za-z0-9-]{24,})\b/g],
  ['personal-path', /[A-Z]:[\\/]+(?:Users[\\/]+jae|Desktop[\\/]+yrkie)\b/gi],
];
for (const file of files) {
  const stat = await lstat(path.join(root, file)).catch(() => null);
  if (!stat?.isFile() || stat.isSymbolicLink()) {
    findings.push({ path: file, rule: 'missing-or-nonregular-source' });
    continue;
  }
  if (/^(?:docs|test)\//.test(file) || /(?:^|\/)AGENTS\.md$/.test(file)
    || /(?:^|\/)(?:node_modules|\.venv|\.run-data|target|dist|__pycache__)(?:\/|$)/.test(file)
    || /(?:^|\/)(?:\.env(?:\.(?!example$)[^/]+)?|master\.key|(?:parser|export|playback-owner)-token)$/.test(file)
    || /\.(?:sqlite3?|db)(?:-(?:wal|shm))?$|\.(?:pem|p12|pfx)$/i.test(file)) {
    findings.push({ path: file, rule: 'private-or-generated-file' });
  }
  const bytes = await readFile(path.join(root, file));
  manifest.push({ path: file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  if (bytes.includes(0)) continue;
  const source = bytes.toString('utf8');
  for (const [rule, pattern] of rules) {
    for (const match of source.matchAll(pattern)) {
      findings.push({ path: file, rule, line: source.slice(0, match.index).split('\n').length });
    }
  }
}
// Output values are restricted to paths, locations and fingerprints, never matching text.
const report = { scope: 'Current tracked and untracked nonignored working files; not Git history.',
  files: manifest.length, bytes: manifest.reduce((sum, item) => sum + item.bytes, 0), findings, manifest };
const args = process.argv.slice(2);
const options = new Map();
for (let index = 0; index < args.length; index += 2) {
  if (!['--manifest', '--snapshot'].includes(args[index]) || !args[index + 1]) {
    throw new Error('Usage: node scripts/audit-open-source.mjs [--manifest test/.../manifest.json] [--snapshot test/.../source]');
  }
  options.set(args[index], args[index + 1]);
}
function artifactPath(value) {
  const destination = path.resolve(root, value);
  const relative = path.relative(path.join(root, 'test'), destination);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Artifacts must be below the ignored test/ directory.');
  }
  return destination;
}
if (options.has('--manifest')) {
  const destination = artifactPath(options.get('--manifest'));
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`);
}
if (findings.length) {
  for (const finding of findings) console.error(`${finding.rule}: ${finding.path}${finding.line ? `:${finding.line}` : ''}`);
  process.exitCode = 1;
} else if (options.has('--snapshot')) {
  const destination = artifactPath(options.get('--snapshot'));
  await mkdir(destination); // Refuse to overwrite or merge an earlier snapshot.
  for (const file of files) {
    await mkdir(path.dirname(path.join(destination, file)), { recursive: true });
    await copyFile(path.join(root, file), path.join(destination, file));
  }
  console.log('Created source snapshot without Git history, ignored runtime data or installed dependencies.');
}
console.log(`Checked ${manifest.length} files (${report.bytes} bytes); ${findings.length} findings.`);
console.log('Pattern checks supplement manual source and license review; they do not prove absence of secrets.');
