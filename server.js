const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Copy socket.io client to public
const sioSrc = path.join(__dirname, 'node_modules/socket.io/client-dist/socket.io.min.js');
const sioDest = path.join(__dirname, 'public/socket.io.min.js');
if (!fs.existsSync(sioDest)) {
  fs.copyFileSync(sioSrc, sioDest);
  console.log('socket.io client copied to public/');
}

// Users DB (flat JSON file)
const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Session tokens: token -> username (in-memory)
const sessions = {};

function generateToken(username) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions[token] = username;
  return token;
}

// Auth Routes
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({ ok: false, error: 'Username and password required' });

  const name = username.trim().slice(0, 20);
  if (name.length < 2)
    return res.json({ ok: false, error: 'Username must be at least 2 characters' });
  if (password.length < 4)
    return res.json({ ok: false, error: 'Password must be at least 4 characters' });

  const users = loadUsers();
  if (users[name.toLowerCase()])
    return res.json({ ok: false, error: 'Username already taken' });

  users[name.toLowerCase()] = {
    username: name,
    password: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  saveUsers(users);

  const token = generateToken(name);
  res.json({ ok: true, token, username: name });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({ ok: false, error: 'Username and password required' });

  const users = loadUsers();
  const record = users[username.trim().toLowerCase()];

  if (!record || record.password !== hashPassword(password))
    return res.json({ ok: false, error: 'Invalid username or password' });

  const token = generateToken(record.username);
  res.json({ ok: true, token, username: record.username });
});

// Socket.io
const onlineUsers = {}; // socket.id -> username

io.on('connection', (socket) => {
  socket.on('join', (token) => {
    const username = sessions[token];
    if (!username) {
      socket.emit('auth-error', 'Invalid session. Please login again.');
      return;
    }

    const alreadyOnline = Object.values(onlineUsers).includes(username);
    if (alreadyOnline) {
      socket.emit('auth-error', 'Already logged in from another tab.');
      return;
    }

    onlineUsers[socket.id] = username;
    io.emit('system', { text: `${username} joined`, type: 'join' });
    io.emit('user-list', Object.values(onlineUsers));
    console.log(`${username} joined`);
  });

  socket.on('message', (text) => {
    const username = onlineUsers[socket.id];
    if (!username || !text.trim()) return;
    io.emit('message', {
      username,
      text: text.trim().slice(0, 500),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on('disconnect', () => {
    const username = onlineUsers[socket.id];
    if (username) {
      delete onlineUsers[socket.id];
      io.emit('system', { text: `${username} left`, type: 'leave' });
      io.emit('user-list', Object.values(onlineUsers));
    }
  });
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('\n🚀 LAN Chat running!');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${ip}:${PORT}`);
  console.log('\nShare the Network URL with your friends\n');
});
