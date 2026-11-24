import { pool } from '../config/db.js';

export const getPendingTechnicians = async (req, res, next) => {
  try {
    // Only show technicians that are NOT verified AND have NOT yet been rejected
    const [techs] = await pool.query(`
      SELECT 
        u.user_id, u.first_name, u.last_name, u.phone_number,
        tp.cnic_number, tp.cnic_front_url, tp.cnic_back_url, tp.base_trust_score,
        sc.name AS trade
      FROM technician_profiles tp
      JOIN users u ON tp.technician_id = u.user_id
      LEFT JOIN technician_services ts ON tp.technician_id = ts.technician_id
      LEFT JOIN service_categories sc ON ts.category_id = sc.category_id
      WHERE tp.is_verified = FALSE AND tp.rejection_reason IS NULL
      ORDER BY tp.created_at DESC
    `);
    return res.status(200).json({ success: true, data: techs });
  } catch (err) {
    next(err);
  }
};

// Fetch rejected candidates with auto-purge countdown
export const getRejectedTechnicians = async (req, res, next) => {
  try {
    const [rejected] = await pool.query(`
      SELECT 
        u.user_id, u.first_name, u.last_name, u.phone_number,
        tp.cnic_number, tp.rejection_reason, tp.rejected_at,
        DATEDIFF(NOW(), tp.rejected_at) AS days_elapsed,
        GREATEST(0, 15 - DATEDIFF(NOW(), tp.rejected_at)) AS days_remaining
      FROM technician_profiles tp
      JOIN users u ON tp.technician_id = u.user_id
      WHERE tp.is_verified = FALSE AND tp.rejection_reason IS NOT NULL
      ORDER BY tp.rejected_at DESC
    `);
    return res.status(200).json({ success: true, data: rejected });
  } catch (err) {
    next(err);
  }
};

export const verifyTechnician = async (req, res, next) => {
  try {
    const { technicianId } = req.params;
    await pool.query(
      'UPDATE technician_profiles SET is_verified = TRUE, rejection_reason = NULL, rejected_at = NULL WHERE technician_id = ?', 
      [technicianId]
    );
    return res.status(200).json({ success: true, message: 'Technician verified successfully.' });
  } catch (err) {
    next(err);
  }
};

export const rejectTechnician = async (req, res, next) => {
  try {
    const { technicianId } = req.params;
    const { reason } = req.body;

    await pool.query(
      `UPDATE technician_profiles 
       SET is_verified = FALSE, 
           is_online = FALSE, 
           rejection_reason = ?, 
           rejected_at = CURRENT_TIMESTAMP 
       WHERE technician_id = ?`,
      [reason || 'CNIC verification failed', technicianId]
    );
    return res.status(200).json({ success: true, message: 'Technician flagged as rejected. Auto-purge in 15 days.' });
  } catch (err) {
    next(err);
  }
};

export const getPlatformStats = async (req, res, next) => {
  try {
    const [[counts]] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER') AS totalCustomers,
        (SELECT COUNT(*) FROM technician_profiles) AS totalTechnicians,
        (SELECT COUNT(*) FROM technician_profiles WHERE is_verified = TRUE) AS verifiedTechnicians,
        (SELECT COUNT(*) FROM technician_profiles WHERE is_verified = FALSE AND rejection_reason IS NOT NULL) AS rejectedTechnicians,
        (SELECT COUNT(*) FROM jobs WHERE status != 'CANCELLED') AS totalJobs,
        (SELECT COUNT(*) FROM job_contracts WHERE contract_status = 'STAGE_2_IN_PROGRESS') AS activeContracts
    `);
    return res.status(200).json({ success: true, data: counts });
  } catch (err) {
    next(err);
  }
};
