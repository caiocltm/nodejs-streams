import { randomUUID } from "node:crypto";
import net from "node:net";
import { Writable } from "node:stream";

const users = new Map();

const streamBroadcaster = (socket) => {
  return Writable({
    write(chunk, enc, callback) {
      const data = JSON.stringify({
        id: socket.id,
        message: chunk.toString(),
      });

      if (chunk.toString().length > 0) {
        notifySubscribers(socket.id, data);
      }

      callback(null, chunk);
    },
  });
};

const closeUsersSockets = () => {
  users.forEach((userSocket) => userSocket.close(), users.delete(userSocket.id));
};

const server = net.createServer((socket) => {
  socket.pipe(streamBroadcaster(socket));
});

server.listen(3000, () => console.info(`Server is listening at port 3000`));

const notifySubscribers = (socketId, data) => {
  [...users.values()].filter((userSocket) => userSocket.id !== socketId).forEach((userSocket) => userSocket.write(data));
};

server.on("connection", (socket) => {
  socket.id = randomUUID();

  console.info(`\nNew user ${socket.id} connected!\n`);

  users.set(socket.id, socket);

  socket.write(JSON.stringify({ id: socket.id }));

  socket.on("close", () => {
    console.info(`\nUser ${socket.id} disconnected!\n`);

    users.delete(socket.id);
  });
});

server.on("close", () => {
  console.info(`Server closed, closing all users sockets...\n`);

  closeUsersSockets();
});
