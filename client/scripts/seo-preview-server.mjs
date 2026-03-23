import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const host = process.env.SEO_PREVIEW_HOST || '0.0.0.0';
const port = Number(process.env.SEO_PREVIEW_PORT || 4177);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

const safeJoin = (...segments) => {
  const resolved = path.resolve(...segments);
  if (!resolved.startsWith(distDir)) {
    return null;
  }
  return resolved;
};

const tryStat = async (targetPath) => {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
};

const readFileResponse = async (filePath, res) => {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[ext] || 'application/octet-stream';
  const body = await fs.readFile(filePath);
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(body);
};

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(requestUrl.pathname);

    if (pathname === '/') {
      await readFileResponse(path.join(distDir, 'index.html'), res);
      return;
    }

    const exactPath = safeJoin(distDir, pathname.replace(/^\/+/, ''));
    if (exactPath) {
      const exactStat = await tryStat(exactPath);
      if (exactStat?.isFile()) {
        await readFileResponse(exactPath, res);
        return;
      }

      if (exactStat?.isDirectory()) {
        const indexPath = path.join(exactPath, 'index.html');
        const indexStat = await tryStat(indexPath);
        if (indexStat?.isFile()) {
          await readFileResponse(indexPath, res);
          return;
        }
      }
    }

    const withHtmlPath = safeJoin(distDir, `${pathname.replace(/^\/+/, '')}.html`);
    if (withHtmlPath) {
      const htmlStat = await tryStat(withHtmlPath);
      if (htmlStat?.isFile()) {
        await readFileResponse(withHtmlPath, res);
        return;
      }
    }

    await readFileResponse(path.join(distDir, '__spa-fallback.html'), res);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`SEO preview server error: ${error instanceof Error ? error.message : 'unknown'}`);
  }
});

server.listen(port, host, () => {
  console.log(`[seo-preview-server] http://${host}:${port}`);
});
