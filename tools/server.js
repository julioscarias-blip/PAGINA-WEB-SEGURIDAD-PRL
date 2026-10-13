const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'sitio');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/') reqUrl = '/index.html';
  
  let filePath = path.join(PUBLIC_DIR, reqUrl);
  
  // Prevenir Directory Traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('403 Prohibido');
    return;
  }
  
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 No Encontrado</h1>');
      return;
    }
    
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    
    fs.stat(filePath, (err2, stats2) => {
      if (err2 || !stats2.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 No Encontrado</h1>');
        return;
      }
      
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor local iniciado en http://localhost:${PORT}/ y http://127.0.0.1:${PORT}/`);
  console.log(`Sitio Institucional: http://127.0.0.1:${PORT}/index.html`);
  console.log(`Landing Page B2B: http://127.0.0.1:${PORT}/landing.html`);
});
