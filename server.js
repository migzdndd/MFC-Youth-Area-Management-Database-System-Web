import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from './Backend/api/router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, 'Frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

/**
 * Polyfill Vercel helper properties (res.status, res.json) for standard Node HTTP response objects
 */
function enhanceResponse(res) {
  if (!res.status) {
    res.status = function (statusCode) {
      res.statusCode = statusCode;
      return res;
    };
  }
  if (!res.json) {
    res.json = function (data) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };
  }
  return res;
}

const server = http.createServer(async (req, res) => {
  enhanceResponse(res);
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Route API calls to Vercel router module
  if (parsedUrl.pathname.startsWith('/api')) {
    const route = parsedUrl.pathname.replace(/^\/api\/?/, '');
    req.query = { route, ...Object.fromEntries(parsedUrl.searchParams) };
    return handler(req, res);
  }

  // Serve static frontend assets
  let filePath = path.join(FRONTEND_DIR, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);

  try {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      } else {
        filePath = path.join(FRONTEND_DIR, '404.html');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`MFC Youth Area Management System running on port ${PORT}`);
});
