// server/socket.js
const Room = require('./models/Room');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', async ({ roomId }) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room ${roomId}`);

      let room = await Room.findOne({ roomId });
      if (!room) {
        room = await Room.create({ roomId, users: [{ socketId: socket.id }] });
      } else {
        room.users.push({ socketId: socket.id });
        await room.save();
      }

      socket.to(roomId).emit('user-joined', { socketId: socket.id });
    });

    socket.on('send-offer', ({ offer, to }) => {
      socket.to(to).emit('receive-offer', { offer, from: socket.id });
    });

    socket.on('send-answer', ({ answer, to }) => {
      socket.to(to).emit('receive-answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
      socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      await Room.updateMany(
        {},
        { $pull: { users: { socketId: socket.id } } }
      );
      io.emit('user-left', { socketId: socket.id });
    });
  });
};
