import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '0.0.0.0';
const root = process.cwd();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', `http://localhost:${port}`);

  if (url.pathname === '/restaurants.json') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(readFileSync(join(root, 'restaurants.json'), 'utf8'));
    return;
  }

  const requestedPath = url.pathname === '/' ? '/modern.html' : url.pathname;
  const filePath = normalize(join(root, decodeURIComponent(requestedPath)));

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`人间寻味记已启动：http://localhost:${port}`);
  getLanUrls(port).forEach((url) => console.log(`iPhone 同一 Wi-Fi 访问：${url}`));
});

function getLanUrls(port) {
  return Object.values(networkInterfaces())
    .flat()
    .filter((item) => item && item.family === 'IPv4' && !item.internal)
    .map((item) => `http://${item.address}:${port}`);
}

function readInitialRestaurants() {
  const source = readFileSync(join(root, 'src', 'initialRestaurants.ts'), 'utf8');
  const rowPattern = /^\s+\['([^']+)', (undefined|'([^']*)'), '([^']+)'\],/gm;
  const rows = [];
  let match;

  while ((match = rowPattern.exec(source))) {
    rows.push({
      name: match[1],
      note: match[3] || undefined,
      address: match[4],
    });
  }

  return rows.map((row, index) => {
    const number = String(index + 1).padStart(3, '0');
    return {
      id: `initial-restaurant-${number}`,
      name: row.name,
      address: row.address,
      note: row.note,
      createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    };
  });
}
