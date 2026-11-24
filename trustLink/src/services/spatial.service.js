import { pool } from '../config/db.js';

export const SpatialService = {
  /**
   * Discovers active, verified technicians within a specified radius (in KM)
   * using MySQL ST_Distance_Sphere.
   */
  findNearbyTechnicians: async (jobId) => {
    const query = `
      SELECT 
        tp.technician_id,
        u.first_name,
        u.last_name,
        u.phone_number,
        tp.base_trust_score,
        ROUND(ST_Distance_Sphere(tp.last_known_location, j.location) / 1000, 2) AS distance_km
      FROM technician_profiles tp
      JOIN users u ON tp.technician_id = u.user_id
      JOIN technician_services ts ON tp.technician_id = ts.technician_id
      JOIN jobs j ON j.job_id = ?
      WHERE tp.is_online = TRUE 
        AND tp.is_verified = TRUE
        AND ts.category_id = j.category_id
        AND ST_Distance_Sphere(tp.last_known_location, j.location) <= (j.search_radius_km * 1000)
      ORDER BY distance_km ASC;
    `;

    const [technicians] = await pool.query(query, [jobId]);
    return technicians;
  }
};