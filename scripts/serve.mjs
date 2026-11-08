import { watch } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { build, dist } from './build.mjs';

const { values } = parseArgs({
  options: { 'no-build': { type: 'boolean' }, port: { type: 'string' } },
});
const shouldBuild = !values['no-build'];
const port = Number(values.port ?? process.env.PORT ?? 4173);
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error('Choose a port between 0 and 65535.');
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

async function handleRequest(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  const url = new URL(request.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  let target = resolve(dist, `.${pathname}`);
  const fromOutput = relative(dist, target);
  if (pathname.includes('\\') || isAbsolute(fromOutput) || fromOutput === '..' || fromOutput.startsWith(`..${sep}`)) {
    response.writeHead(400).end();
    return;
  }

  if ((await stat(target)).isDirectory()) {
    if (!pathname.endsWith('/')) {
      response.writeHead(308, { Location: `${url.pathname}/${url.search}` }).end();
      return;
    }
    target = join(target, 'index.html');
  }

  const contents = await readFile(target);
  response.writeHead(200, {
    'Content-Type': mime[extname(target)] ?? 'application/octet-stream',
    'Content-Length': contents.byteLength,
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  }).end(request.method === 'HEAD' ? undefined : contents);
}

if (shouldBuild) {
  await build();
  let timer;
  let pendingBuild = Promise.resolve();
  watch(new URL('../src/', import.meta.url), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      pendingBuild = pendingBuild.then(build).catch(error => console.error(error.message));
    }, 150);
  });
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch(error => {
    const status = error instanceof URIError ? 400 : ['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500;
    if (status === 500) console.error(error.message);
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }).end();
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Preview at http://127.0.0.1:${server.address().port}/`);
});
