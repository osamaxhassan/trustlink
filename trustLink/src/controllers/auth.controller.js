import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'trustlink_super_secure_jwt_secret_key_2026';

export const register = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { phoneNumber, password, firstName, lastName, role, cnicNumber, categoryId } = req.body;
    const cnicFrontFile = req.files?.['cnicFront']?.[0];
    const cnicBackFile = req.files?.['cnicBack']?.[0];

    if (!phoneNumber || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ success: false, message: 'All primary personal fields are required.' });
    }

    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT user_id FROM users WHERE phone_number = ?', [phoneNumber]);
    if (existing.length > 0) {
      throw new Error('An account with this phone number already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      `INSERT INTO users (phone_number, password_hash, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [phoneNumber, hashedPassword, firstName, lastName, role]
    );

    const userId = userResult.insertId;

    if (role === 'TECHNICIAN') {
      if (!cnicNumber || !categoryId) {
        throw new Error('Technicians must provide a CNIC number and primary trade category.');
      }

      if (!cnicFrontFile || !cnicBackFile) {
        throw new Error('Please upload clear photos of both CNIC Front and Back sides.');
      }

      const cnicFrontUrl = `http://localhost:5000/uploads/${cnicFrontFile.filename}`;
      const cnicBackUrl = `http://localhost:5000/uploads/${cnicBackFile.filename}`;

      await connection.query(
        `INSERT INTO technician_profiles 
         (technician_id, cnic_number, cnic_front_url, cnic_back_url, is_verified, is_online, last_known_location)
         VALUES (?, ?, ?, ?, FALSE, TRUE, POINT(74.3540, 31.5204))`,
        [userId, cnicNumber, cnicFrontUrl, cnicBackUrl]
      );

      await connection.query(
        `INSERT INTO technician_services (technician_id, category_id) VALUES (?, ?)`,
        [userId, categoryId]
      );
    }

    await connection.commit();

    const token = jwt.sign(
      { userId, role, phone: phoneNumber, name: `${firstName} ${lastName}` },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { 
        token, 
        user: { 
          userId, 
          role, 
          firstName, 
          lastName, 
          phoneNumber, 
          avatar_url: null, 
          default_address: null 
        } 
      }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const login = async (req, res, next) => {
  try {
    const { phoneNumber, password } = req.body;

    const [users] = await pool.query('SELECT * FROM users WHERE phone_number = ?', [phoneNumber]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }

    let techProfile = null;
    if (user.role === 'TECHNICIAN') {
      const [techs] = await pool.query(
        `SELECT tp.*, sc.name AS trade_name 
         FROM technician_profiles tp
         LEFT JOIN technician_services ts ON tp.technician_id = ts.technician_id
         LEFT JOIN service_categories sc ON ts.category_id = sc.category_id
         WHERE tp.technician_id = ?`,
        [user.user_id]
      );
      techProfile = techs[0] || null;
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role, phone: user.phone_number, name: `${user.first_name} ${user.last_name}` },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Fixed: Return avatar_url and default_address so images persist across logins!
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          userId: user.user_id,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          phoneNumber: user.phone_number,
          avatar_url: user.avatar_url,
          default_address: user.default_address,
          technician: techProfile
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const toggleOnlineStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    await pool.query('UPDATE technician_profiles SET is_online = ? WHERE technician_id = ?', [isOnline, req.user.userId]);
    return res.status(200).json({ success: true, message: `Status updated to ${isOnline ? 'Online' : 'Offline'}` });
  } catch (err) {
    next(err);
  }
};
