import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trustlink_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  timezone: '+05:00', // Pakistan Standard Time
});

// Self-check database connection on launch
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL/MariaDB Database Pool');
    conn.release();
  } catch (err) {
    console.error('❌ Database Connection Failed:', err.message);
  }
})();