const express = require('express');
const Room = require('../models/Room');
const router = express.Router();


router.post('/', async (req, res) => {
  const { roomId } = req.body;

  let room = await Room.findOne({ roomId });
  if (!room) {
    room = await Room.create({ roomId, users: [] });
  }
  res.json(room);
});

module.exports = router;
