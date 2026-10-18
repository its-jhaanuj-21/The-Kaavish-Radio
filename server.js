const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.webmanifest': 'application/manifest+json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function getNotesFromDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(NOTES_FILE)) {
      const data = fs.readFileSync(NOTES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading notes file:', err);
  }
  return [];
}

function saveNotesToDisk(notes) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing notes file:', err);
    return false;
  }
}

// In-memory real active listeners tracker
const activeListeners = new Map(); // sessionId -> lastSeenTimestamp
const HEARTBEAT_TIMEOUT_MS = 35000; // 35 seconds inactivity timeout

function pruneStaleListeners() {
  const now = Date.now();
  for (const [sessionId, lastSeen] of activeListeners.entries()) {
    if (now - lastSeen > HEARTBEAT_TIMEOUT_MS) {
      activeListeners.delete(sessionId);
    }
  }
}

function getActiveListenerCount() {
  pruneStaleListeners();
  return activeListeners.size;
}

const server = http.createServer((req, res) => {
  // CORS & caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let safePath = decodeURI(req.url.split('?')[0]);

  // Live active listeners heartbeat API
  if (safePath === '/api/heartbeat' || safePath === '/api/listeners') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 10000) req.destroy();
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const sessionId = (payload.sessionId || '').trim();
          if (sessionId) {
            activeListeners.set(sessionId, Date.now());
          }
        } catch (err) {}
        const count = getActiveListenerCount();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ count: Math.max(1, count) }));
      });
      return;
    }

    if (req.method === 'GET') {
      const count = getActiveListenerCount();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify({ count: Math.max(1, count) }));
      return;
    }
  }

  // Listener tab closed / left
  if (safePath === '/api/leave') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 10000) req.destroy();
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const sessionId = (payload.sessionId || '').trim();
          if (sessionId && activeListeners.has(sessionId)) {
            activeListeners.delete(sessionId);
          }
        } catch (err) {}
        const count = getActiveListenerCount();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ count: Math.max(1, count) }));
      });
      return;
    }
  }

  // API endpoint for fan community notes
  if (safePath === '/api/notes') {
    if (req.method === 'GET') {
      const notes = getNotesFromDisk();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify(notes));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 50000) {
          req.destroy(); // Protect against oversized payloads
        }
      });

      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const text = (payload.text || '').trim();
          const author = (payload.author || '').trim();

          if (!text) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Note text is required' }));
            return;
          }

          const newNote = {
            id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            text: text.slice(0, 300),
            author: (author || 'Anonymous Listener').slice(0, 60),
            timestamp: new Date().toISOString()
          };

          const notes = getNotesFromDisk();
          notes.unshift(newNote);
          saveNotesToDisk(notes);

          res.writeHead(201, { 'Content-Type': 'application/json; charset=UTF-8' });
          res.end(JSON.stringify({ success: true, note: newNote, notes }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  const filePath = path.join(__dirname, safePath);

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': contentType,
      'Content-Length': stats.size
    };

    if (filePath.endsWith('sw.js')) {
      headers['Service-Worker-Allowed'] = '/';
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }

    res.writeHead(200, headers);

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
    stream.pipe(res);
  });
});

server.on('clientError', (err, socket) => {
  // Silently ignore TLS handshake or malformed client requests without crashing
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}/ and http://0.0.0.0:${PORT}/`);
});
