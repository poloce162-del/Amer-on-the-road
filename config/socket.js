const { Server } = require('socket.io');

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*'
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('new-order', (data) => {
      io.emit('receive-order', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};