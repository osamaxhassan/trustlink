import { setIO } from './socketEmitter.js';
import { pool } from '../config/db.js';

export const initSockets = (io) => {
  setIO(io);

  io.on('connection', (socket) => {
    socket.on('join_personal_channel', (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on('join_job_channel', (jobId) => {
      socket.join(`job_${jobId}`);
    });

    // InDrive Real-Time GPS Tracking Stream
    socket.on('technician:stream_gps', async ({ jobId, technicianId, lat, lng }) => {
      try {
        // Broadcast moving coordinates to customer in the job room
        io.to(`job_${jobId}`).emit('technician:moved', { lat, lng });

        // Update last known location in database
        await pool.query(
          'UPDATE technician_profiles SET last_known_location = POINT(?, ?) WHERE technician_id = ?',
          [lng, lat, technicianId]
        );
      } catch (err) {
        console.error('GPS stream error:', err.message);
      }
    });

    socket.on('disconnect', () => {});
  });
};
