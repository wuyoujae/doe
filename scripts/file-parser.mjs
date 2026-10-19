import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

// The process and its token belong to this local installation, independently of any commercial service.
export async function startFileParser({ onExit } = {}) {
  const dataDir = path.resolve(root, process.env.YRKIE_DATA_DIR || '.run-data/backend');
  await mkdir(dataDir, { recursive: true });
  const tokenPath = path.join(dataDir, 'parser-token');
  try { await writeFile(tokenPath, randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  const token = (await readFile(tokenPath, 'utf8')).trim();
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('The local parser token file is invalid. Preserve the file and restore a valid installation token.');
  const parserRoot = path.join(root, 'backend/file-parser');
  const localPython = path.join(parserRoot, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  let python = process.env.YRKIE_PARSER_PYTHON;
  if (!python) { try { await access(localPython); python = localPython; } catch { python = process.platform === 'win32' ? 'python' : 'python3'; } }
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^(YRKIE_FILE_PARSER_|OTHERONE_FILE_PARSER_|FILE_PARSER_|ADMIN_ERROR_INGEST)/.test(key)) delete env[key];
  Object.assign(env, {
    PYTHONPATH: path.join(parserRoot, 'src'),
    PYTHONUNBUFFERED: '1',
    YRKIE_FILE_PARSER_HOST: '127.0.0.1',
    YRKIE_FILE_PARSER_PORT: '7765',
    YRKIE_FILE_PARSER_INTERNAL_TOKEN: token,
    YRKIE_FILE_PARSER_TEMP_DIR: path.join(dataDir, 'parser-temp'),
    YRKIE_FILE_PARSER_EAGER_INIT: 'true',
    YRKIE_ENVIRONMENT: 'development',
    ADMIN_ERROR_INGEST_URL: '',
  });
  let stopping = false;
  let child;
  let timer;
  const launch = () => {
    child = spawn(python, ['-m', 'otherone_file_parser'], { cwd: root, env, stdio: 'inherit', windowsHide: true });
    child.once('error', error => { console.error(`File parser: ${error.message}. Install backend/file-parser with Python 3.12.`); onExit?.(1); });
    child.once('exit', code => {
      if (stopping) return;
      if (code === 70) { timer = setTimeout(launch, 1000); return; }
      onExit?.(code ?? 1);
    });
  };
  launch();
  return { stop() { stopping = true; clearTimeout(timer); child?.kill('SIGTERM'); } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const parser = await startFileParser({ onExit: code => { process.exitCode = code; } });
  process.on('SIGINT', () => parser.stop());
  process.on('SIGTERM', () => parser.stop());
}
