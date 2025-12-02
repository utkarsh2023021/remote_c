const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;

// CORS for API (optional)
app.use(cors({
  origin: [
    'http://localhost:5173',           // local dev client (Vite or similar)
    'https://your-client.netlify.app'  // your deployed client URL
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

// socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://your-client.netlify.app'
    ],
    methods: ['GET', 'POST']
  }
});

// PeerJS server
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'   // final path will be /peerjs/peerjs
});

// mount peer server at /peerjs
app.use('/peerjs', peerServer);

// simple health route
app.get('/', (req, res) => {
  res.send('Remote-control signaling server is running');
});

// socket.io events
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('newUser', (id, room) => {
    socket.join(room);
    socket.to(room).broadcast.emit('userJoined', id);

    socket.on('disconnect', () => {
      socket.to(room).broadcast.emit('userDisconnect', id);
    });
  });

  socket.on('control-event', (room, payload) => {
    socket.to(room).emit('control-event', payload);
  });
});

server.listen(port, () => {
  console.log('Server running on port ' + port);
});
