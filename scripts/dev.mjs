import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { startFileParser } from './file-parser.mjs';
import { startExportRuntime } from './export-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const children = new Set();
let stopping = false;
let parser;
let exporter;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  parser?.stop();
  exporter?.stop();
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

function launch(command, args, cwd = root) {
  const child = spawn(command, args, { cwd, stdio: 'inherit', windowsHide: true });
  children.add(child);
  child.once('error', error => { console.error(error.message); children.delete(child); stop(1); });
  child.once('exit', code => { children.delete(child); if (!stopping) stop(code ?? 1); });
  return child;
}

// Build first, then own the server process directly so shutdown cannot orphan it.
const build = spawn('cargo', ['build', '--locked', '--manifest-path', 'backend/Cargo.toml'], { cwd: root, stdio: 'inherit', windowsHide: true });
children.add(build);
const built = await new Promise(resolve => {
  build.once('error', error => { console.error(error.message); resolve(false); });
  build.once('exit', code => resolve(code === 0));
});
children.delete(build);
if (!built || stopping) stop(1);
else {
  try {
    parser = await startFileParser({ onExit: stop });
    if (stopping) parser.stop();
    else {
      exporter = await startExportRuntime({ onExit: stop });
      if (stopping) exporter.stop();
      else {
        const targetDir = process.env.CARGO_TARGET_DIR ? path.resolve(root, process.env.CARGO_TARGET_DIR) : path.join(root, 'backend/target');
        launch(path.join(targetDir, 'debug', process.platform === 'win32' ? 'yrkie-backend.exe' : 'yrkie-backend'), []);
        launch(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js')], path.join(root, 'frontend'));
      }
    }
  } catch (error) { console.error(error.message); stop(1); }
}
