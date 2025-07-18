require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
const roomRoutes = require('./routes/roomRoutes');
const socketHandler = require('./socket');
app.use(cors());
app.use(express.json());
app.use('/api/rooms', roomRoutes);
socketHandler(io);
if (!process.env.MONGO_URI) {
  console.error(" MONGO_URI is not defined");
  process.exit(1);
}
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(' MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error('❌ MongoDB Error:', err));
