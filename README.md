# LAN Chat

A real-time local network chat app — no internet required. Just run the server, share the IP, and anyone on the same LAN or hotspot can chat instantly in their browser.

Uses log in method, password is also hashed no repeated username.

Built with **Node.js**, **Express**, and **Socket.io**.

---

## Screenshots

> Dark terminal-style UI with live messaging, online users list, and join/leave notifications.

---

## Features

- Real-time messaging via WebSockets (Socket.io)
-  Register or log in 
-  Username selection on join
-  Live online users list
-  Join / leave notifications
-  Your own messages are highlighted
-  Works on mobile browsers
-  100% offline — no internet needed
-  Works on Linux, Windows, macOS, and Termux (Android)

---

## Project Structure

```
lan-chat/
├── public/
│   └── index.html      # Frontend (single file — HTML + CSS + JS)
├── server.js           # Node.js + Express + Socket.io server
├── package.json        # Dependencies
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v14 or higher

### Installation

```bash
# Clone the repo
git clone https://github.com/Ashray-poojary/lan-chat.git
cd lan-chat

# Install dependencies
npm install
```

### Run

```bash
node server.js
```

Output:
```
🚀 LAN Chat running!
   Local:   http://localhost:3000
   Network: http://192.168.x.x:3000
```

Open `http://localhost:3000` in your browser, or share the **Network URL** with anyone on the same LAN.

---

## Usage on a College Lab (Ethernet LAN)

1. Run the server on one PC in the lab
2. Find your IP:
   ```bash
   # Linux
   ip a

   # Windows
   ipconfig
   ```
3. Share `http://YOUR_IP:3000` with friends on the same network
4. Everyone opens the URL in their browser and joins with a username

No router or internet needed — just a switch/cable connecting the PCs.

---

## Usage on Android (Termux)

```bash
# Install Node.js
pkg update && pkg install nodejs

# Clone or copy the project
mkdir lan-chat && cd lan-chat
mkdir public

# Create files (paste contents)
nano server.js
nano package.json
nano public/index.html

# Install and run
npm install
node server.js
```

To test from a second phone:
1. Enable **Mobile Hotspot** on the Termux phone
2. Connect the second phone to that hotspot
3. Open `http://192.168.43.x:3000` (IP shown in terminal)

---

## How It Works

```
Browser (Client)
     │
     │  WebSocket (Socket.io)
     ▼
Node.js Server (server.js)
     │
     ├── Tracks connected users (socket.id → username)
     ├── Broadcasts messages to all clients
     ├── Emits join/leave system events
     └── Serves static files from /public
```

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join` | Client → Server | User joins with a username |
| `message` | Client → Server | User sends a message |
| `message` | Server → Client | Broadcast message to all |
| `system` | Server → Client | Join/leave notification |
| `user-list` | Server → Client | Updated list of online users |

---

## Configuration

Default port is `3000`. Change it with an environment variable:

```bash
PORT=8080 node server.js
```

---

## Stop the Server

```bash
# In terminal
Ctrl + C

# If running in background
pkill node
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js |
| Server | Express |
| Realtime | Socket.io |
| Frontend | Vanilla HTML / CSS / JS |

---

## License

MIT — free to use, modify, and share.
