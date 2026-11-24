import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import { initSockets } from './sockets/index.js';
import { startRadiusExpanderWorker } from './workers/radiusExpander.worker.js';
import { startPurgeWorker } from './workers/purgeRejected.worker.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

initSockets(io);
startRadiusExpanderWorker();
startPurgeWorker(); // Starts 15-day purge cron

server.listen(PORT, () => {
  console.log(`🚀 TrustLink Core API running on port ${PORT}`);
  console.log(`⚡ WebSocket Server active`);
  console.log(`🕒 Radius Expander worker initialized`);
  console.log(`🧹 15-Day Data Retention & Purge worker initialized`);
});
