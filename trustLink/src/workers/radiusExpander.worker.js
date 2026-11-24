import cron from 'node-cron';
import { pool } from '../config/db.js';
import { SpatialService } from '../services/spatial.service.js';
import { emitToUser } from '../sockets/socketEmitter.js';

export const startRadiusExpanderWorker = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      // 1. Fetch jobs that have been searching for >= 5 minutes with initial radius of 5.0 KM
      const [staleJobs] = await pool.query(
        `SELECT job_id, title, description, address_text, category_id
         FROM jobs 
         WHERE status = 'SEARCHING' 
           AND search_radius_km = 5.0 
           AND created_at <= (NOW() - INTERVAL 5 MINUTE)`
      );

      for (const job of staleJobs) {
        // 2. Expand search radius to 10.0 KM
        await pool.query(
          `UPDATE jobs SET search_radius_km = 10.0 WHERE job_id = ?`,
          [job.job_id]
        );

        console.log(`📡 Expanding search radius to 10km for Job #${job.job_id}`);

        // 3. Re-broadcast to new technician pool in the wider perimeter
        const newTechPool = await SpatialService.findNearbyTechnicians(job.job_id);

        newTechPool.forEach((tech) => {
          emitToUser(tech.technician_id, 'job:new_nearby', {
            jobId: job.job_id,
            title: job.title,
            description: job.description,
            addressText: job.address_text,
            distanceKm: tech.distance_km,
            isRadiusExpanded: true
          });
        });
      }
    } catch (error) {
      console.error('Error executing radius expander cron:', error.message);
    }
  });
};