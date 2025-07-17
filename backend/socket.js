// const Room = require('./models/Room');

// module.exports = (io) => {
//   io.on('connection', (socket) => {
//     console.log('User connected:', socket.id);

//     socket.on('join-room', async ({ roomId }) => {
//       socket.join(roomId);
//       console.log(`${socket.id} joined room ${roomId}`);

//       let room = await Room.findOne({ roomId });
//       if (!room) {
//         room = await Room.create({ roomId, users: [{ socketId: socket.id }] });
//       } else {
//         room.users.push({ socketId: socket.id });
//         await room.save();
//       }

//       socket.to(roomId).emit('user-joined', { socketId: socket.id });
//     });

//     socket.on('send-offer', ({ offer, to }) => {
//       socket.to(to).emit('receive-offer', { offer, from: socket.id });
//     });

//     socket.on('send-answer', ({ answer, to }) => {
//       socket.to(to).emit('receive-answer', { answer, from: socket.id });
//     });

//     socket.on('ice-candidate', ({ candidate, to }) => {
//       socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
//     });

//     socket.on('disconnect', async () => {
//       console.log('User disconnected:', socket.id);
//       await Room.updateMany(
//         {},
//         { $pull: { users: { socketId: socket.id } } }
//       );
//       io.emit('user-left', { socketId: socket.id });
//     });
//   });
// };







const Room = require('./models/Room');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔗 User connected:', socket.id);

    // --- Join Room ---
    socket.on('join-room', async ({ roomId }) => {
      socket.join(roomId);
      console.log(`📥 ${socket.id} joined room ${roomId}`);

      let room = await Room.findOne({ roomId });

      if (!room) {
        // Create new room with first user
        room = await Room.create({ roomId, users: [{ socketId: socket.id }] });
      } else {
        // Add new user only if not already present
        if (!room.users.some(user => user.socketId === socket.id)) {
          room.users.push({ socketId: socket.id });
          await room.save();
        }
      }

      const otherUsers = room.users.filter(user => user.socketId !== socket.id);

      // Notify newly joined user about existing users
      socket.emit('other-users', { users: otherUsers });

      // Notify existing users in room about the new user
      if (otherUsers.length > 0) {
        socket.to(roomId).emit('user-joined', { socketId: socket.id });
      }
    });

    // --- WebRTC Signaling ---
    socket.on('send-offer', ({ offer, to }) => {
      console.log(`📡 Offer from ${socket.id} to ${to}`);
      socket.to(to).emit('receive-offer', { offer, from: socket.id });
    });

    socket.on('send-answer', ({ answer, to }) => {
      console.log(`📡 Answer from ${socket.id} to ${to}`);
      socket.to(to).emit('receive-answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
      socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    // --- Manual Leave Room ---
    socket.on('leave-room', async ({ roomId }) => {
      console.log(`🚪 ${socket.id} left room ${roomId}`);
      socket.leave(roomId);

      await Room.updateOne(
        { roomId },
        { $pull: { users: { socketId: socket.id } } }
      );

      socket.to(roomId).emit('user-left', { socketId: socket.id });
    });

    // --- Handle Disconnect ---
    socket.on('disconnect', async () => {
      console.log('❌ User disconnected:', socket.id);

      const rooms = await Room.find({ 'users.socketId': socket.id });

      for (const room of rooms) {
        await Room.updateOne(
          { roomId: room.roomId },
          { $pull: { users: { socketId: socket.id } } }
        );
        socket.to(room.roomId).emit('user-left', { socketId: socket.id });
      }
    });
  });
};

