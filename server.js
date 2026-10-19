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

const crypto = require('crypto');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

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

// ---------------------------------------------------------------------------
// User Accounts & Musical Profiles Storage
// ---------------------------------------------------------------------------
function getUsersFromDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading users file:', err);
  }
  return {};
}

function saveUsersToDisk(users) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing users file:', err);
    return false;
  }
}

function computeInitials(name) {
  if (!name) return 'KR';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  try {
    const computed = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch (e) {
    return false;
  }
}

// In-memory active sessions: token -> { userId, createdAt }
const activeSessions = new Map();

function getUserIdFromToken(token) {
  if (!token) return null;
  const clean = token.replace(/^Bearer\s+/i, '').trim();
  const session = activeSessions.get(clean);
  if (session && Date.now() - session.createdAt < 30 * 24 * 3600 * 1000) {
    return session.userId;
  }
  return null;
}

function sanitizeUser(user, includePrivate = false) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    initials: user.initials || computeInitials(user.name),
    createdAt: user.createdAt,
    profile: {
      favSinger: (user.profile && user.profile.favSinger) || '',
      favSong: (user.profile && user.profile.favSong) || '',
      status: (user.profile && user.profile.status) || ''
    },
    friendsCount: (user.friends || []).length,
    friends: includePrivate ? (user.friends || []) : undefined
  };
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
  const envelope = {
    ...payload,
    serverTime: Date.now()
  };
  const dataStr = `event: ${eventName}\ndata: ${JSON.stringify(envelope)}\n\n`;
  for (const [memberId, member] of room.members.entries()) {
    if (excludeMemberId && memberId === excludeMemberId) continue;
    if (member.res && !member.res.writableEnded) {
      try {
        member.res.write(dataStr);
        if (typeof member.res.flush === 'function') member.res.flush();
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
  // Disable Nagle's algorithm for zero network packet buffering latency
  if (req.socket && req.socket.setNoDelay) {
    try { req.socket.setNoDelay(true); } catch (e) {}
  }

  // CORS & caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-transform, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let safePath = decodeURI(req.url.split('?')[0]);

  // High-precision server clock calibration endpoint
  if (safePath === '/api/time') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify({ serverTime: Date.now() }));
    return;
  }

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
  // User Authentication & Musical Profile Endpoints
  // -------------------------------------------------------------------------

  // 1. Register new user
  if (safePath === '/api/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20000) req.destroy();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const name = (payload.name || '').trim();
        const username = (payload.username || '').toLowerCase().trim();
        const password = (payload.password || '').trim();
        const favSinger = (payload.favSinger || '').trim();
        const favSong = (payload.favSong || '').trim();
        const status = (payload.status || '').trim();

        if (!name || name.length < 2 || name.length > 60) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Name must be between 2 and 60 characters.' }));
          return;
        }

        if (!username || !/^[a-z0-9_]{3,20}$/.test(username)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Username must be 3-20 characters (letters, numbers, underscores only).' }));
          return;
        }

        if (!password || password.length < 6) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Password must be at least 6 characters.' }));
          return;
        }

        const users = getUsersFromDisk();

        // Check if username already exists
        const exists = Object.values(users).some(u => u.username === username);
        if (exists) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: `Username @${username} is already taken. Please choose another.` }));
          return;
        }

        const { salt, hash } = hashPassword(password);
        const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

        const newUser = {
          id: userId,
          name,
          username,
          passwordHash: hash,
          salt,
          initials: computeInitials(name),
          createdAt: Date.now(),
          profile: {
            favSinger: favSinger.slice(0, 60) || 'The Kaavish',
            favSong: favSong.slice(0, 60) || 'Faasle',
            status: status.slice(0, 160) || 'Listening to peaceful acoustic chords...'
          },
          friends: []
        };

        users[userId] = newUser;
        saveUsersToDisk(users);

        const token = crypto.randomBytes(32).toString('hex');
        activeSessions.set(token, { userId, createdAt: Date.now() });

        res.writeHead(201, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
          success: true,
          token,
          user: sanitizeUser(newUser, true)
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid signup payload' }));
      }
    });
    return;
  }

  // 2. Login user
  if (safePath === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20000) req.destroy();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const username = (payload.username || '').toLowerCase().trim();
        const password = (payload.password || '').trim();

        if (!username || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Username and password are required.' }));
          return;
        }

        const users = getUsersFromDisk();
        const user = Object.values(users).find(u => u.username === username);

        if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid username or password.' }));
          return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        activeSessions.set(token, { userId: user.id, createdAt: Date.now() });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
          success: true,
          token,
          user: sanitizeUser(user, true)
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid login payload' }));
      }
    });
    return;
  }

  // 3. Current User Profile (/api/auth/me)
  if (safePath === '/api/auth/me' && req.method === 'GET') {
    const authHeader = req.headers.authorization || '';
    const userId = getUserIdFromToken(authHeader);

    if (!userId) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Not authenticated' }));
      return;
    }

    const users = getUsersFromDisk();
    const user = users[userId];

    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'User not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify({
      success: true,
      user: sanitizeUser(user, true)
    }));
    return;
  }

  // 4. Update Musical Profile (/api/auth/profile)
  if (safePath === '/api/auth/profile' && req.method === 'POST') {
    const authHeader = req.headers.authorization || '';
    const userId = getUserIdFromToken(authHeader);

    if (!userId) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Authentication required' }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20000) req.destroy();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const users = getUsersFromDisk();
        const user = users[userId];

        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found' }));
          return;
        }

        if (payload.name && payload.name.trim().length >= 2) {
          user.name = payload.name.trim().slice(0, 60);
          user.initials = computeInitials(user.name);
        }

        if (!user.profile) user.profile = {};
        if (payload.favSinger !== undefined) user.profile.favSinger = String(payload.favSinger).trim().slice(0, 60);
        if (payload.favSong !== undefined) user.profile.favSong = String(payload.favSong).trim().slice(0, 60);
        if (payload.status !== undefined) user.profile.status = String(payload.status).trim().slice(0, 160);

        saveUsersToDisk(users);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
          success: true,
          user: sanitizeUser(user, true)
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid profile payload' }));
      }
    });
    return;
  }

  // 5. Logout (/api/auth/logout)
  if (safePath === '/api/auth/logout' && req.method === 'POST') {
    const authHeader = req.headers.authorization || '';
    const clean = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (clean) activeSessions.delete(clean);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 6. Friends List (Visible only to confirmed friends)
  if (safePath === '/api/friends/list' && req.method === 'GET') {
    const authHeader = req.headers.authorization || '';
    const myId = getUserIdFromToken(authHeader);

    if (!myId) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Please log in to view friends.' }));
      return;
    }

    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const targetUserId = urlObj.searchParams.get('userId') || myId;

    const users = getUsersFromDisk();
    const myUser = users[myId];
    const targetUser = users[targetUserId];

    if (!targetUser) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'User not found' }));
      return;
    }

    // Privacy rule: Only mutual friends or oneself can see the friend list!
    const isSelf = (targetUserId === myId);
    const areFriends = (myUser && (myUser.friends || []).includes(targetUserId));

    if (!isSelf && !areFriends) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Private: This friend list is only visible to confirmed friends.'
      }));
      return;
    }

    const friendsList = (targetUser.friends || [])
      .map(fid => users[fid])
      .filter(Boolean)
      .map(u => sanitizeUser(u, false));

    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify({
      success: true,
      friends: friendsList,
      count: friendsList.length
    }));
    return;
  }

  // -------------------------------------------------------------------------
  // Real-time Mehfil / Sync Rooms Endpoints
  // -------------------------------------------------------------------------

  // 1. Create a new room (supports private / account-only mode)
  if (safePath === '/api/room/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20000) req.destroy();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const authHeader = req.headers.authorization || payload.token || '';
        const hostUserId = getUserIdFromToken(authHeader);

        const users = getUsersFromDisk();
        const hostUser = hostUserId ? users[hostUserId] : null;

        const roomId = generateRoomId();
        const memberId = 'm_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        const state = payload.state || {};
        const trackIndex = (typeof state.trackIndex === 'number') ? state.trackIndex : 0;
        const isPlaying = Boolean(state.isPlaying);
        const currentTime = (typeof state.currentTime === 'number') ? state.currentTime : 0;
        const isPrivate = payload.isPrivate !== false && Boolean(hostUser);

        const now = Date.now();
        const newRoom = {
          id: roomId,
          hostId: memberId,
          hostUserId: hostUser ? hostUser.id : null,
          hostName: hostUser ? hostUser.name : (payload.hostName || 'Host'),
          isPrivate,
          createdAt: now,
          lastActive: now,
          state: {
            trackIndex,
            isPlaying,
            currentTime,
            anchorPosition: currentTime,
            anchorServerTime: now,
            updatedAt: now
          },
          members: new Map(),
          pendingKnocks: new Map() // knockId -> { guestUser, status: 'pending'|'approved'|'declined', timestamp }
        };

        rooms.set(roomId, newRoom);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
          success: true,
          roomId,
          memberId,
          isHost: true,
          isPrivate,
          hostUser: hostUser ? sanitizeUser(hostUser, false) : null,
          serverTime: now,
          state: newRoom.state
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request payload' }));
      }
    });
    return;
  }

  // 2. Join an existing room (enforces knocking and friend verification for private rooms)
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

        const authHeader = req.headers.authorization || payload.token || '';
        const guestUserId = getUserIdFromToken(authHeader);
        const users = getUsersFromDisk();
        const guestUser = guestUserId ? users[guestUserId] : null;

        // If room is private / account-only
        if (room.isPrivate) {
          if (!guestUser) {
            res.writeHead(403, { 'Content-Type': 'application/json; charset=UTF-8' });
            res.end(JSON.stringify({
              success: false,
              code: 'ACCOUNT_REQUIRED',
              error: 'This is a private friend Mehfil. Please log in or create an account to request entry.'
            }));
            return;
          }

          const hostUser = room.hostUserId ? users[room.hostUserId] : null;
          const isHost = (guestUser.id === room.hostUserId);
          const isAlreadyFriend = hostUser && (hostUser.friends || []).includes(guestUser.id);

          // If not host and not already friends -> Require knocking!
          if (!isHost && !isAlreadyFriend) {
            res.writeHead(403, { 'Content-Type': 'application/json; charset=UTF-8' });
            res.end(JSON.stringify({
              success: false,
              code: 'KNOCK_REQUIRED',
              hostUser: hostUser ? sanitizeUser(hostUser, false) : { name: room.hostName || 'Host', initials: 'KR' },
              message: `Knock at the door to request joining ${hostUser ? hostUser.name : 'Host'}'s Mehfil.`
            }));
            return;
          }
        }

        const now = Date.now();
        const memberId = 'm_' + Math.random().toString(36).substring(2, 9) + '_' + now;
        room.lastActive = now;

        // Calculate accurate elapsed playback position from anchor
        let estTime = room.state.anchorPosition !== undefined ? room.state.anchorPosition : room.state.currentTime;
        if (room.state.isPlaying) {
          const anchorTime = room.state.anchorServerTime || room.state.updatedAt;
          const elapsed = (now - anchorTime) / 1000;
          estTime += Math.max(0, elapsed);
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
          success: true,
          roomId: room.id,
          memberId,
          isHost: Boolean(guestUser && guestUser.id === room.hostUserId),
          serverTime: now,
          state: {
            ...room.state,
            currentTime: estTime
          },
          anchor: {
            trackIndex: room.state.trackIndex,
            isPlaying: room.state.isPlaying,
            anchorPosition: room.state.anchorPosition !== undefined ? room.state.anchorPosition : estTime,
            anchorServerTime: room.state.anchorServerTime || now
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

  // 2b. Knock on a Private Room Door (Guest -> Host Approval Request)
  if (safePath === '/api/room/knock' && req.method === 'POST') {
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
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Room not found' }));
          return;
        }

        const authHeader = req.headers.authorization || payload.token || '';
        const guestUserId = getUserIdFromToken(authHeader);
        const users = getUsersFromDisk();
        const guestUser = guestUserId ? users[guestUserId] : null;

        if (!guestUser) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Please log in to knock.' }));
          return;
        }

        const knockId = 'kn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        if (!room.pendingKnocks) room.pendingKnocks = new Map();

        const knockEntry = {
          knockId,
          guestUserId: guestUser.id,
          guestUser: sanitizeUser(guestUser, false),
          status: 'pending',
          createdAt: Date.now()
        };
        room.pendingKnocks.set(knockId, knockEntry);

        // Broadcast live knocking notification to Host SSE
        broadcastToRoom(room, 'room_knock', {
          knockId,
          roomId: room.id,
          guestUser: sanitizeUser(guestUser, false)
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
          success: true,
          knockId,
          status: 'pending'
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid knock request' }));
      }
    });
    return;
  }

  // 2c. Check Knock Status (Guest polls or awaits host answer)
  if (safePath === '/api/room/knock-status' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const code = (urlObj.searchParams.get('roomId') || '').trim().replace(/[^0-9]/g, '');
    const knockId = (urlObj.searchParams.get('knockId') || '').trim();
    const authHeader = req.headers.authorization || '';
    const guestUserId = getUserIdFromToken(authHeader);

    const room = rooms.get(code);
    if (!room || !room.pendingKnocks) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Knock request not found or expired' }));
      return;
    }

    let knock = null;
    if (knockId && room.pendingKnocks.has(knockId)) {
      knock = room.pendingKnocks.get(knockId);
    } else if (guestUserId) {
      for (const entry of room.pendingKnocks.values()) {
        if (entry.guestUserId === guestUserId) {
          knock = entry;
          break;
        }
      }
    }

    if (!knock) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Knock request not found or expired' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify({
      success: true,
      knockId: knock.knockId,
      status: knock.status // 'pending' | 'approved' | 'declined'
    }));
    return;
  }

  // 2d. Host Response to Knock (Allow & Add Friend OR Decline)
  if (safePath === '/api/room/knock-response' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20000) req.destroy();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const code = (payload.roomId || '').toString().trim().replace(/[^0-9]/g, '');
        const knockId = (payload.knockId || '').trim();
        const applicantUserId = (payload.applicantUserId || '').trim();
        const allow = Boolean(payload.allow !== undefined ? payload.allow : payload.approved);

        const room = rooms.get(code);
        if (!room || !room.pendingKnocks) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Knock request expired' }));
          return;
        }

        let knock = null;
        if (knockId && room.pendingKnocks.has(knockId)) {
          knock = room.pendingKnocks.get(knockId);
        } else if (applicantUserId) {
          for (const entry of room.pendingKnocks.values()) {
            if (entry.guestUserId === applicantUserId) {
              knock = entry;
              break;
            }
          }
        }

        if (!knock) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Knock request expired' }));
          return;
        }

        const authHeader = req.headers.authorization || payload.token || '';
        const hostUserId = getUserIdFromToken(authHeader);

        if (!hostUserId || (room.hostUserId && hostUserId !== room.hostUserId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Only the room host can respond to knocks' }));
          return;
        }

        knock.status = allow ? 'approved' : 'declined';

        if (allow) {
          // Permanently add each other to mutual Friends list!
          const users = getUsersFromDisk();
          const hostUser = users[hostUserId];
          const guestUser = users[knock.guestUserId];

          if (hostUser && guestUser) {
            if (!hostUser.friends) hostUser.friends = [];
            if (!guestUser.friends) guestUser.friends = [];

            if (!hostUser.friends.includes(guestUser.id)) hostUser.friends.push(guestUser.id);
            if (!guestUser.friends.includes(hostUser.id)) guestUser.friends.push(hostUser.id);

            saveUsersToDisk(users);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
          success: true,
          knockId: knock.knockId,
          status: knock.status
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid response payload' }));
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

    const now = Date.now();
    let estTime = room.state.anchorPosition !== undefined ? room.state.anchorPosition : room.state.currentTime;
    if (room.state.isPlaying) {
      const anchorTime = room.state.anchorServerTime || room.state.updatedAt;
      const elapsed = (now - anchorTime) / 1000;
      estTime += Math.max(0, elapsed);
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify({
      success: true,
      roomId: room.id,
      serverTime: now,
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

    // Set up SSE response headers with zero buffering
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=UTF-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*'
    });
    if (typeof res.flushHeaders === 'function') res.flushHeaders();
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

    const now = Date.now();
    let estTime = room.state.anchorPosition !== undefined ? room.state.anchorPosition : room.state.currentTime;
    if (room.state.isPlaying) {
      const anchorTime = room.state.anchorServerTime || room.state.updatedAt;
      const elapsed = (now - anchorTime) / 1000;
      estTime += Math.max(0, elapsed);
    }

    const initData = {
      type: 'INIT',
      roomId: room.id,
      memberId,
      isHost,
      serverTime: now,
      state: {
        ...room.state,
        currentTime: estTime
      },
      anchor: {
        trackIndex: room.state.trackIndex,
        isPlaying: room.state.isPlaying,
        anchorPosition: room.state.anchorPosition !== undefined ? room.state.anchorPosition : estTime,
        anchorServerTime: room.state.anchorServerTime || now
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

        const now = Date.now();

        // Update server room state with master anchor timeline
        if (action === 'PLAY') {
          room.state.isPlaying = true;
          room.state.anchorPosition = typeof data.currentTime === 'number' ? data.currentTime : 0;
          room.state.anchorServerTime = now;
          if (typeof data.trackIndex === 'number') room.state.trackIndex = data.trackIndex;
          room.state.currentTime = room.state.anchorPosition;
          room.state.updatedAt = now;
        } else if (action === 'PAUSE') {
          room.state.isPlaying = false;
          room.state.anchorPosition = typeof data.currentTime === 'number' ? data.currentTime : 0;
          room.state.anchorServerTime = now;
          room.state.currentTime = room.state.anchorPosition;
          room.state.updatedAt = now;
        } else if (action === 'SEEK') {
          room.state.anchorPosition = typeof data.currentTime === 'number' ? data.currentTime : 0;
          room.state.anchorServerTime = now;
          room.state.currentTime = room.state.anchorPosition;
          room.state.updatedAt = now;
        } else if (action === 'TRACK_CHANGE') {
          if (typeof data.trackIndex === 'number') room.state.trackIndex = data.trackIndex;
          room.state.anchorPosition = typeof data.currentTime === 'number' ? data.currentTime : 0;
          room.state.anchorServerTime = now;
          room.state.currentTime = room.state.anchorPosition;
          room.state.isPlaying = data.autoPlay !== false;
          room.state.updatedAt = now;
        }

        room.lastActive = now;

        // Broadcast action with anchor timeline snapshot
        broadcastToRoom(room, 'sync_action', {
          action,
          data,
          senderId: memberId,
          timestamp: now,
          anchor: {
            trackIndex: room.state.trackIndex,
            isPlaying: room.state.isPlaying,
            anchorPosition: room.state.anchorPosition,
            anchorServerTime: room.state.anchorServerTime
          }
        }, memberId);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ success: true, serverTime: now }));
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
