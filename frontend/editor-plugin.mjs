import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileRuntime } from '../packages/doe/scripts/build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../packages/doe');
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain', '.map': 'application/json' };

export function editorRuntime() {
  let compiled;
  let production = false;
  let refresh = Promise.resolve();
  const load = () => compiled ||= compileRuntime({ sourcemap: !production });
  return {
    name: 'yrkie-editor-runtime',
    configResolved(config) { production = config.command === 'build'; },
    async buildStart() { await load(); },
    async configureServer(server) {
      await load();
      server.watcher.add(root);
      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try { pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname); }
        catch { response.writeHead(400).end(); return; }
        if (!pathname.startsWith('/yrkie-doe/')) { next(); return; }
        if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
        try {
          await refresh;
          const bytes = (await load()).assets.get(pathname);
          if (!bytes) { response.writeHead(404).end(); return; }
          response.setHeader('Content-Type', mime[path.extname(pathname)] || 'application/octet-stream');
          response.setHeader('Cache-Control', 'no-cache');
          response.end(request.method === 'HEAD' ? undefined : bytes);
        } catch (error) { next(error); }
      });
      server.watcher.on('change', file => {
        const relative = path.relative(root, file).split(path.sep).join('/');
        if (relative.startsWith('../') || /(^|\/)(\.cache|\.venv|node_modules|__pycache__)\//.test(relative)
          || /^packages\/doe-export\/(python|node)\//.test(relative)) return;
        refresh = refresh.catch(() => {}).then(async () => {
          const next = await compileRuntime({ sourcemap: true });
          compiled = Promise.resolve(next);
          server.ws.send({ type: 'full-reload' });
        });
      });
    },
    async generateBundle() {
      for (const [url, source] of (await load()).assets) this.emitFile({ type: 'asset', fileName: url.slice(1), source });
    },
  };
}
