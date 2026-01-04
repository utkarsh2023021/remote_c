// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.get('/', (req, res) => {
  res.send('Signaling server running...');
});

io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  socket.on('join-room', async ({ roomId, role }) => {
    // join
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.role = role;

    // collect current participants' roles (including those already in the room)
    const socketsInRoom = await io.in(roomId).allSockets(); // Set of socket ids
    const participants = [];
    for (const id of socketsInRoom) {
      const s = io.sockets.sockets.get(id);
      if (s && s.data && s.data.role) {
        participants.push({ socketId: id, role: s.data.role });
      }
    }

    // notify the joining socket about who is in the room now
    socket.emit('room-info', { participants });

    // notify others that a new peer joined
    socket.to(roomId).emit('peer-joined', { role });

    console.log(`socket ${socket.id} joined ${roomId} as ${role}`);
  });

  socket.on('offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('offer', { offer });
  });

  socket.on('answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('answer', { answer });
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { candidate });
  });

  socket.on('control-event', ({ roomId, payload }) => {
    socket.to(roomId).emit('control-event', payload);
  });

  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
    const roomId = socket.data.roomId;
    if (roomId) {
      socket.to(roomId).emit('peer-left', { role: socket.data.role });
    }
  });
});

server.listen(port, () => console.log('Server running on http://localhost:' + port));
