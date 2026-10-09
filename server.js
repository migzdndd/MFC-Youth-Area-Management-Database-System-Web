import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from './Backend/api/router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const MODERN_DIST_DIR = path.join(__dirname, 'frontend-react', 'dist');
const LEGACY_FRONTEND_DIR = path.join(__dirname, 'Frontend');
const FRONTEND_DIR = (process.env.SERVE_LEGACY !== 'true' && fs.existsSync(MODERN_DIST_DIR))
  ? MODERN_DIST_DIR
  : LEGACY_FRONTEND_DIR;

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

  // Normalize casing for static frontend routes so users reach pages regardless of caps
  const lowerPathname = parsedUrl.pathname.toLowerCase();
  if (parsedUrl.pathname !== lowerPathname) {
    res.writeHead(301, { Location: lowerPathname + (parsedUrl.search || '') + (parsedUrl.hash || '') });
    return res.end();
  }

  // Serve static frontend assets
  let filePath = path.join(FRONTEND_DIR, lowerPathname === '/' ? 'index.html' : lowerPathname);

  try {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      if (FRONTEND_DIR === MODERN_DIST_DIR) {
        filePath = path.join(MODERN_DIST_DIR, 'index.html');
      } else if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      } else {
        filePath = path.join(FRONTEND_DIR, '404.html');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);

    let cacheControl = 'public, max-age=0, must-revalidate';
    if (ext === '.png' || ext === '.jpg' || ext === '.svg' || ext === '.ico') {
      cacheControl = 'public, max-age=604800, stale-while-revalidate=2592000';
    } else if (ext === '.css' || (ext === '.js' && !filePath.endsWith('sw.js'))) {
      cacheControl = 'public, max-age=86400, stale-while-revalidate=604800';
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`MFC Youth Area Management System running on port ${PORT}`);
});

const gracefulShutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { server };
export default server;

