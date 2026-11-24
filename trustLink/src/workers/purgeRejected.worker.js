import cron from 'node-cron';
import { pool } from '../config/db.js';

export const startPurgeWorker = () => {
  // Runs every midnight (00:00) to permanently delete rejected candidates older than 15 days
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🧹 Running 15-day purge worker for rejected registrations...');

      // Find all users rejected more than 15 days ago
      const [expiredUsers] = await pool.query(`
        SELECT u.user_id, u.first_name, u.last_name 
        FROM users u
        JOIN technician_profiles tp ON u.user_id = tp.technician_id
        WHERE tp.is_verified = FALSE 
          AND tp.rejection_reason IS NOT NULL 
          AND tp.rejected_at <= (NOW() - INTERVAL 15 DAY)
      `);

      for (const user of expiredUsers) {
        // Deleting from users cascades to technician_profiles and technician_services
        await pool.query('DELETE FROM users WHERE user_id = ?', [user.user_id]);
        console.log(`🗑️ Permanently purged rejected candidate #${user.user_id} (${user.first_name} ${user.last_name}) after 15 days.`);
      }
    } catch (err) {
      console.error('Error running 15-day purge worker:', err.message);
    }
  });
};
