import { pool } from '../config/db.js';

export const getTrustedContacts = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const [contacts] = await pool.query(
      'SELECT contact_id AS id, name, phone_number AS phone FROM trusted_contacts WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return res.status(200).json({ success: true, data: contacts });
  } catch (err) {
    next(err);
  }
};

export const addTrustedContact = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Contact name and phone number are required.' });
    }

    const [[count]] = await pool.query('SELECT COUNT(*) AS total FROM trusted_contacts WHERE user_id = ?', [userId]);
    if (count.total >= 4) {
      return res.status(400).json({ success: false, message: 'You can add up to 4 trusted contacts.' });
    }

    const [result] = await pool.query(
      'INSERT INTO trusted_contacts (user_id, name, phone_number) VALUES (?, ?, ?)',
      [userId, name, phone]
    );

    return res.status(201).json({
      success: true,
      message: 'Trusted contact added',
      data: { id: result.insertId, name, phone }
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTrustedContact = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await pool.query('DELETE FROM trusted_contacts WHERE contact_id = ? AND user_id = ?', [id, userId]);
    return res.status(200).json({ success: true, message: 'Contact removed.' });
  } catch (err) {
    next(err);
  }
};
