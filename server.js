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

// ---------------------------------------------------------------------------
// In-Memory Mehfil / Sync Rooms Engine (Listen Together in Sync)
// ---------------------------------------------------------------------------
const rooms = new Map(); // roomId -> RoomObject

function generateRoomId() {
  let id = '';
  let attempts = 0;
  do {
    id = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
  } while (rooms.has(id) && attempts < 100);
  return id;
}

function broadcastToRoom(room, eventName, payload, excludeMemberId = null) {
  room.lastActive = Date.now();
  const dataStr = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const [memberId, member] of room.members.entries()) {
    if (excludeMemberId && memberId === excludeMemberId) continue;
    if (member.res && !member.res.writableEnded) {
      try {
        member.res.write(dataStr);
      } catch (err) {
        console.error('Error writing SSE to member:', err);
      }
    }
  }
}

function pruneInactiveRooms() {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    const isEmpty = room.members.size === 0;
    // Empty for > 30 minutes, or inactive for > 6 hours
    if ((isEmpty && now - room.lastActive > 30 * 60 * 1000) || (now - room.lastActive > 6 * 3600 * 1000)) {
      rooms.delete(roomId);
    }
  }
}
setInterval(pruneInactiveRooms, 60000);

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

  // -------------------------------------------------------------------------
  // Real-time Mehfil / Sync Rooms Endpoints
  // -------------------------------------------------------------------------

  // 1. Create a new room
  if (safePath === '/api/room/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20000) req.destroy();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const roomId = generateRoomId();
        const memberId = 'm_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        const state = payload.state || {};
        const trackIndex = (typeof state.trackIndex === 'number') ? state.trackIndex : 0;
        const isPlaying = Boolean(state.isPlaying);
        const currentTime = (typeof state.currentTime === 'number') ? state.currentTime : 0;

        const newRoom = {
          id: roomId,
          hostId: memberId,
          createdAt: Date.now(),
          lastActive: Date.now(),
          state: {
            trackIndex,
            isPlaying,
            currentTime,
            updatedAt: Date.now()
          },
          members: new Map()
        };

        rooms.set(roomId, newRoom);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
          success: true,
          roomId,
          memberId,
          isHost: true,
          state: newRoom.state
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request payload' }));
      }
    });
    return;
  }

  // 2. Join an existing room
  if (safePath === '/api/room/join' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20000) req.destroy();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const rawCode = (payload.roomId || '').toString().trim().replace(/[^0-9]/g, '');
        const room = rooms.get(rawCode);

        if (!room) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=UTF-8' });
          res.end(JSON.stringify({ success: false, error: 'Room not found. Please check the 6-digit code.' }));
          return;
        }

        const memberId = 'm_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        room.lastActive = Date.now();

        // Calculate accurate elapsed playback position
        let estTime = room.state.currentTime;
        if (room.state.isPlaying) {
          const elapsed = (Date.now() - room.state.updatedAt) / 1000;
          estTime += Math.max(0, elapsed);
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
          success: true,
          roomId: room.id,
          memberId,
          isHost: false,
          state: {
            ...room.state,
            currentTime: estTime
          },
          membersCount: room.members.size + 1
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request payload' }));
      }
    });
    return;
  }

  // 3. Room Info query
  if (safePath === '/api/room/info' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const code = (urlObj.searchParams.get('roomId') || '').trim().replace(/[^0-9]/g, '');
    const room = rooms.get(code);

    if (!room) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify({ success: false, error: 'Room not found' }));
      return;
    }

    let estTime = room.state.currentTime;
    if (room.state.isPlaying) {
      const elapsed = (Date.now() - room.state.updatedAt) / 1000;
      estTime += Math.max(0, elapsed);
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify({
      success: true,
      roomId: room.id,
      state: { ...room.state, currentTime: estTime },
      membersCount: room.members.size
    }));
    return;
  }

  // 4. Room Server-Sent Events (SSE) Stream
  if (safePath === '/api/room/events' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const code = (urlObj.searchParams.get('roomId') || '').trim().replace(/[^0-9]/g, '');
    const memberId = (urlObj.searchParams.get('memberId') || '').trim();
    const name = (urlObj.searchParams.get('name') || 'Listener').trim().slice(0, 40);

    const room = rooms.get(code);
    if (!room || !memberId) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Room or member ID not found');
      return;
    }

    // Set up SSE response headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=UTF-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(': connected\n\n');

    const isHost = (memberId === room.hostId);
    const member = {
      id: memberId,
      name,
      isHost,
      res,
      lastSeen: Date.now()
    };

    room.members.set(memberId, member);
    room.lastActive = Date.now();

    // Send initial snapshot to joining client
    let estTime = room.state.currentTime;
    if (room.state.isPlaying) {
      const elapsed = (Date.now() - room.state.updatedAt) / 1000;
      estTime += Math.max(0, elapsed);
    }

    const initData = {
      type: 'INIT',
      roomId: room.id,
      memberId,
      isHost,
      state: {
        ...room.state,
        currentTime: estTime
      },
      membersCount: room.members.size
    };
    res.write(`event: room_init\ndata: ${JSON.stringify(initData)}\n\n`);

    // Broadcast member_joined to all other room members
    broadcastToRoom(room, 'member_joined', {
      memberId,
      name,
      isHost,
      membersCount: room.members.size
    }, memberId);

    // Keep-alive heartbeat ping
    const pingInterval = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(pingInterval);
        return;
      }
      try {
        res.write(': ping\n\n');
      } catch (err) {
        clearInterval(pingInterval);
      }
    }, 20000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(pingInterval);
      if (room.members.has(memberId)) {
        room.members.delete(memberId);
        broadcastToRoom(room, 'member_left', {
          memberId,
          name,
          membersCount: room.members.size
        });
        room.lastActive = Date.now();
      }
    });

    return;
  }

  // 5. Broadcast a sync action to the room
  if (safePath === '/api/room/action' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20000) req.destroy();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const code = (payload.roomId || '').toString().trim().replace(/[^0-9]/g, '');
        const memberId = (payload.memberId || '').trim();
        const action = payload.action; // 'PLAY' | 'PAUSE' | 'SEEK' | 'TRACK_CHANGE'
        const data = payload.data || {};

        const room = rooms.get(code);
        if (!room) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Room not found' }));
          return;
        }

        // Update server room state
        if (action === 'PLAY') {
          room.state.isPlaying = true;
          if (typeof data.currentTime === 'number') room.state.currentTime = data.currentTime;
          if (typeof data.trackIndex === 'number') room.state.trackIndex = data.trackIndex;
          room.state.updatedAt = Date.now();
        } else if (action === 'PAUSE') {
          room.state.isPlaying = false;
          if (typeof data.currentTime === 'number') room.state.currentTime = data.currentTime;
          room.state.updatedAt = Date.now();
        } else if (action === 'SEEK') {
          if (typeof data.currentTime === 'number') room.state.currentTime = data.currentTime;
          room.state.updatedAt = Date.now();
        } else if (action === 'TRACK_CHANGE') {
          if (typeof data.trackIndex === 'number') room.state.trackIndex = data.trackIndex;
          room.state.currentTime = (typeof data.currentTime === 'number') ? data.currentTime : 0;
          room.state.isPlaying = data.autoPlay !== false;
          room.state.updatedAt = Date.now();
        }

        room.lastActive = Date.now();

        // Broadcast action to all other members in the room
        broadcastToRoom(room, 'sync_action', {
          action,
          data,
          senderId: memberId,
          timestamp: Date.now()
        }, memberId);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid action payload' }));
      }
    });
    return;
  }

  // 6. Leave room explicitly
  if (safePath === '/api/room/leave' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10000) req.destroy();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const code = (payload.roomId || '').toString().trim().replace(/[^0-9]/g, '');
        const memberId = (payload.memberId || '').trim();
        const room = rooms.get(code);

        if (room && room.members.has(memberId)) {
          const member = room.members.get(memberId);
          room.members.delete(memberId);
          broadcastToRoom(room, 'member_left', {
            memberId,
            name: member ? member.name : 'Listener',
            membersCount: room.members.size
          });
          room.lastActive = Date.now();
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ success: true }));
      }
    });
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
