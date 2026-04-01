const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Copy socket.io client to public so it works even if opened directly
const sioSrc = path.join(__dirname, 'node_modules/socket.io/client-dist/socket.io.min.js');
const sioDest = path.join(__dirname, 'public/socket.io.min.js');
if (!fs.existsSync(sioDest)) {
  fs.copyFileSync(sioSrc, sioDest);
  console.log('socket.io client copied to public/');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const users = {}; // socket.id -> username

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

io.on('connection', (socket) => {
  console.log('New connection: ' + socket.id);

  socket.on('join', (username) => {
    const name = username.trim().slice(0, 20) || 'Anonymous';
    users[socket.id] = name;

    // Notify everyone
    io.emit('system', { text: `${name} joined the chat`, type: 'join' });
    io.emit('user-list', Object.values(users));
    console.log(`${name} joined`);
  });

  socket.on('message', (text) => {
    const username = users[socket.id];
    if (!username || !text.trim()) return;
    io.emit('message', {
      username,
      text: text.trim().slice(0, 500),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      id: socket.id
    });
  });

  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      delete users[socket.id];
      io.emit('system', { text: `${username} left`, type: 'leave' });
      io.emit('user-list', Object.values(users));
      console.log(`${username} left`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('\n🚀 LAN Chat running!');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${ip}:${PORT}`);
  console.log('\nShare the Network URL with your friends on the same WiFi/LAN\n');
});
