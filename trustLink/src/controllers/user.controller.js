import { pool } from '../config/db.js';

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const [rows] = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.phone_number, u.role, u.avatar_url, u.default_address,
              tp.is_verified, tp.base_trust_score, tp.rejection_reason
       FROM users u
       LEFT JOIN technician_profiles tp ON u.user_id = tp.technician_id
       WHERE u.user_id = ?`,
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { defaultAddress, lng, lat } = req.body;
    let avatarUrl = null;

    if (req.file) {
      avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    // 1. Update users table
    if (avatarUrl && defaultAddress) {
      await pool.query('UPDATE users SET avatar_url = ?, default_address = ? WHERE user_id = ?', [avatarUrl, defaultAddress, userId]);
    } else if (avatarUrl) {
      await pool.query('UPDATE users SET avatar_url = ? WHERE user_id = ?', [avatarUrl, userId]);
    } else if (defaultAddress) {
      await pool.query('UPDATE users SET default_address = ? WHERE user_id = ?', [defaultAddress, userId]);
    }

    // 2. If user is a Technician and coordinates were passed, sync last_known_location!
    if (lng && lat) {
      await pool.query(
        'UPDATE technician_profiles SET last_known_location = POINT(?, ?) WHERE technician_id = ?',
        [Number(lng), Number(lat), userId]
      );
    }

    const [[updated]] = await pool.query('SELECT user_id, first_name, last_name, avatar_url, default_address FROM users WHERE user_id = ?', [userId]);

    return res.status(200).json({ success: true, message: 'Profile & GPS location updated', data: updated });
  } catch (err) {
    next(err);
  }
};
