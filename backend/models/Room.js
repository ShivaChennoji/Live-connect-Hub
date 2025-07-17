const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  users: [{ socketId: String }]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);