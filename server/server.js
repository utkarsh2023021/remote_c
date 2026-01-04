const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

let activeRoom = null;

io.on("connection", (socket) => {
  socket.on("join-host", (room) => {
    activeRoom = room;
    socket.join(room);
  });

  socket.on("join-controller", (room) => {
    socket.join(room);
  });

  socket.on("join-agent", () => {
    if (activeRoom) socket.join(activeRoom);
  });

  socket.on("offer", ({ room, offer }) =>
    socket.to(room).emit("offer", offer)
  );

  socket.on("answer", ({ room, answer }) =>
    socket.to(room).emit("answer", answer)
  );

  socket.on("ice", ({ room, candidate }) =>
    socket.to(room).emit("ice", candidate)
  );

  socket.on("control", ({ room, payload }) =>
    socket.to(room).emit("control", payload)
  );
});

server.listen(4000, () =>
  console.log("Server on https://remote-c.onrender.com")
);
