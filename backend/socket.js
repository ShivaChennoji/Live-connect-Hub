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
    console.log('User connected:', socket.id);

    // Join a room
    socket.on('join-room', async ({ roomId }) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room ${roomId}`);

      let room = await Room.findOne({ roomId });
      if (!room) {
        room = await Room.create({ roomId, users: [{ socketId: socket.id }] });
      } else {
        // Prevent duplicate socket entries
        if (!room.users.some(user => user.socketId === socket.id)) {
          room.users.push({ socketId: socket.id });
          await room.save();
        }
      }

      // Notify other users in the room
      socket.to(roomId).emit('user-joined', { socketId: socket.id });

      // Optionally: send current users to the newly joined user
      const otherUsers = room.users.filter(user => user.socketId !== socket.id);
      socket.emit('other-users', { users: otherUsers });
    });

    // WebRTC Signaling
    socket.on('send-offer', ({ offer, to }) => {
      socket.to(to).emit('receive-offer', { offer, from: socket.id });
    });

    socket.on('send-answer', ({ answer, to }) => {
      socket.to(to).emit('receive-answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
      socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    // Handle user leaving the room manually
    socket.on('leave-room', async ({ roomId }) => {
      console.log(`${socket.id} left room ${roomId}`);
      socket.leave(roomId);

      await Room.updateOne(
        { roomId },
        { $pull: { users: { socketId: socket.id } } }
      );

      socket.to(roomId).emit('user-left', { socketId: socket.id });
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);

      // Remove user from all rooms
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
