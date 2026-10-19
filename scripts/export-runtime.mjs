import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileRuntime } from '../packages/doe/scripts/build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

// Original DOE engine, with installation-owned resources and credentials.
export async function startExportRuntime({ onExit } = {}) {
  const data = path.resolve(root, process.env.YRKIE_DATA_DIR || '.run-data/backend');
  const runtime = path.join(root, 'packages/doe/packages/doe-export/python');
  const publicRoot = path.join(data, 'export-runtime/public');
  const temporaryRoot = path.join(data, 'export-runtime/temp');
  await mkdir(publicRoot, { recursive: true });
  await mkdir(temporaryRoot, { recursive: true });
  const tokenPath = path.join(data, 'export-token');
  try { await writeFile(tokenPath, randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  const token = (await readFile(tokenPath, 'utf8')).trim();
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid local export token; preserve and restore the installation token.');
  const compiled = await compileRuntime({ sourcemap: false });
  for (const [url, bytes] of compiled.assets) {
    const file = path.join(publicRoot, url.slice(1));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
  }
  await cp(path.join(root, 'frontend/public/fonts'), path.join(publicRoot, 'fonts'), { recursive: true });
  const localPython = path.join(runtime, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  let python = process.env.YRKIE_EXPORT_PYTHON;
  if (!python) {
    try { await access(localPython); python = localPython; }
    catch { throw new Error('Install the independent Python 3.12 environment in packages/doe/packages/doe-export/python/.venv.'); }
  }
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^(YRKIE_HTMLIR_|OTHERONE_|ADMIN_ERROR_INGEST)/.test(key)) delete env[key];
  Object.assign(env, {
    PYTHONUNBUFFERED: '1', YRKIE_ENVIRONMENT: 'development',
    YRKIE_HTMLIR_RUNTIME_TOKEN: token, YRKIE_HTMLIR_NODE_EXECUTABLE: process.execPath,
    YRKIE_DOE_PUBLIC_ROOT: publicRoot, YRKIE_SCHEMA_RENDERER_ROOT: path.join(publicRoot, 'yrkie-doe'),
    YRKIE_SCHEMA_FONT_CACHE_DIR: path.join(data, 'export-runtime/fonts'),
    YRKIE_EXPORT_WORDMARK_PATH: path.join(runtime, 'resources/brand/logo-text.webp'),
    TMP: temporaryRoot, TEMP: temporaryRoot, TMPDIR: temporaryRoot,
  });
  let stopping = false;
  let failed = false;
  const child = spawn(python, ['htmlir_server.py', '--host', '127.0.0.1', '--port', '7766', '--max-concurrency', '2'], {
    cwd: runtime, env, stdio: 'inherit', windowsHide: true, detached: process.platform !== 'win32',
  });
  child.once('error', error => { failed = true; console.error(`Export runtime: ${error.message}`); if (!stopping) onExit?.(1); });
  child.once('exit', code => { failed = true; if (!stopping) onExit?.(code ?? 1); });
  const stop = () => {
    if (stopping) return;
    stopping = true;
    if (!child.pid || child.exitCode !== null) return;
    // The engine owns Node/Chromium descendants as well as its Python process.
    if (process.platform === 'win32') spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else { try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); } }
  };
  try {
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline && !failed) {
      try {
        const response = await fetch('http://127.0.0.1:7766/api/status', {
          headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(1500),
        });
        if (response.ok && (await response.json()).service === 'yrkie-htmlir-runtime') return { stop };
      } catch { /* Wait until the original browser worker has warmed. */ }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    throw new Error('The local export runtime did not become ready. Install its Python and npm dependencies.');
  } catch (error) { stop(); throw error; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const runtime = await startExportRuntime({ onExit: code => { process.exitCode = code; } });
  process.on('SIGINT', () => runtime.stop());
  process.on('SIGTERM', () => runtime.stop());
}
