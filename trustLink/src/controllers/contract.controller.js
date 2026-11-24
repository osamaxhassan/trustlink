import { pool } from '../config/db.js';
import crypto from 'crypto';
import { emitToUser, emitToJobRoom } from '../sockets/socketEmitter.js';

export const lockStage1 = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { jobId, bidId } = req.body;
    await connection.beginTransaction();

    const [[job]] = await connection.query(
      `SELECT j.status, j.customer_id, j.title, j.address_text, CONCAT(u.first_name, ' ', u.last_name) AS customer_name, u.phone_number AS customer_phone
       FROM jobs j
       JOIN users u ON j.customer_id = u.user_id
       WHERE j.job_id = ? FOR UPDATE`,
      [jobId]
    );

    if (!job || (job.status !== 'SEARCHING' && job.status !== 'OFFERS_RECEIVED')) {
      throw new Error('This job is no longer accepting bids.');
    }

    const [[bid]] = await connection.query(
      'SELECT technician_id, visit_fee FROM bids WHERE bid_id = ? AND job_id = ? FOR UPDATE',
      [bidId, jobId]
    );

    if (!bid) throw new Error('Selected bid was not found.');

    const stage2Pin = Math.floor(1000 + Math.random() * 9000).toString();
    const pinHash = crypto.createHash('sha256').update(stage2Pin).digest('hex');

    await connection.query("UPDATE jobs SET status = 'LOCKED_STAGE_1' WHERE job_id = ?", [jobId]);
    await connection.query("UPDATE bids SET status = IF(bid_id = ?, 'ACCEPTED', 'REJECTED') WHERE job_id = ?", [bidId, jobId]);

    const [contractResult] = await connection.query(
      `INSERT INTO job_contracts 
       (job_id, technician_id, accepted_bid_id, stage2_pin, stage1_visit_fee, stage2_verification_pin_hash, contract_status)
       VALUES (?, ?, ?, ?, ?, ?, 'STAGE_1_EN_ROUTE')`,
      [jobId, bid.technician_id, bidId, stage2Pin, bid.visit_fee, pinHash]
    );

    const contractId = contractResult.insertId;
    await connection.commit();

    emitToUser(bid.technician_id, 'job:stage1_locked', {
      contractId,
      jobId,
      visitFee: bid.visit_fee,
      customerName: job.customer_name,
      customerPhone: job.customer_phone,
      addressText: job.address_text,
      title: job.title
    });

    return res.status(200).json({
      success: true,
      message: 'Stage 1 locked. Technician dispatched.',
      data: { contractId, stage2VerificationPin: stage2Pin }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const getTechnicianActiveContract = async (req, res, next) => {
  try {
    const techId = req.user.userId;
    const query = `
      SELECT 
        jc.contract_id AS contractId,
        jc.job_id AS jobId,
        jc.stage1_visit_fee AS visitFee,
        jc.stage2_final_labor AS finalLaborFee,
        jc.contract_status AS status,
        j.title,
        j.description,
        j.address_text AS addressText,
        CONCAT(u.first_name, ' ', u.last_name) AS customerName,
        u.phone_number AS customerPhone,
        u.avatar_url AS customerAvatar
      FROM job_contracts jc
      JOIN jobs j ON jc.job_id = j.job_id
      JOIN users u ON j.customer_id = u.user_id
      WHERE jc.technician_id = ?
        AND jc.contract_status IN ('STAGE_1_EN_ROUTE', 'STAGE_1_ARRIVED', 'STAGE_2_IN_PROGRESS')
      ORDER BY jc.stage1_locked_at DESC LIMIT 1
    `;
    const [contracts] = await pool.query(query, [techId]);
    return res.status(200).json({ success: true, data: contracts[0] || null });
  } catch (err) {
    next(err);
  }
};

export const markArrived = async (req, res, next) => {
  try {
    const { contractId } = req.body;
    await pool.query(
      `UPDATE job_contracts 
       SET contract_status = 'STAGE_1_ARRIVED', technician_arrived_at = CURRENT_TIMESTAMP 
       WHERE contract_id = ?`,
      [contractId]
    );

    const [[contract]] = await pool.query(
      'SELECT j.customer_id, jc.job_id FROM job_contracts jc JOIN jobs j ON jc.job_id = j.job_id WHERE jc.contract_id = ?',
      [contractId]
    );

    if (contract) {
      emitToUser(contract.customer_id, 'technician:arrived', { contractId });
    }

    return res.status(200).json({ success: true, message: 'Marked as arrived.' });
  } catch (err) {
    next(err);
  }
};

export const approveStage2 = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { contractId, finalLaborFee, enteredPin } = req.body;
    await connection.beginTransaction();

    const hashedPin = crypto.createHash('sha256').update(String(enteredPin)).digest('hex');

    const [[contract]] = await connection.query(
      'SELECT contract_id, job_id, technician_id, stage2_verification_pin_hash FROM job_contracts WHERE contract_id = ? FOR UPDATE',
      [contractId]
    );

    if (!contract || contract.stage2_verification_pin_hash !== hashedPin) {
      throw new Error('Invalid 4-digit verification PIN.');
    }

    await connection.query(
      `UPDATE job_contracts 
       SET stage2_final_labor = ?, stage2_locked_at = CURRENT_TIMESTAMP, contract_status = 'STAGE_2_IN_PROGRESS'
       WHERE contract_id = ?`,
      [finalLaborFee, contractId]
    );

    await connection.query("UPDATE jobs SET status = 'LOCKED_STAGE_2' WHERE job_id = ?", [contract.job_id]);

    await connection.commit();

    emitToJobRoom(contract.job_id, 'job:stage2_approved', {
      contractId,
      finalLaborFee: Number(finalLaborFee),
      status: 'STAGE_2_IN_PROGRESS'
    });

    emitToUser(contract.technician_id, 'job:stage2_approved', { contractId, finalLaborFee });

    return res.status(200).json({ success: true, message: 'Stage 2 approved. Work commenced.' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const completeJob = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { contractId, rating, reviewText } = req.body;
    const customerId = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Please provide a valid rating (1 to 5 stars).' });
    }

    await connection.beginTransaction();

    const [[contract]] = await connection.query(
      `SELECT jc.contract_id, jc.job_id, jc.technician_id, jc.stage1_visit_fee, jc.stage2_final_labor, jc.contract_status
       FROM job_contracts jc
       JOIN jobs j ON jc.job_id = j.job_id
       WHERE jc.contract_id = ? AND j.customer_id = ? FOR UPDATE`,
      [contractId, customerId]
    );

    if (!contract || contract.contract_status !== 'STAGE_2_IN_PROGRESS') {
      throw new Error('Contract is not in active progress.');
    }

    await connection.query(
      `UPDATE job_contracts 
       SET contract_status = 'SETTLED', completed_at = CURRENT_TIMESTAMP 
       WHERE contract_id = ?`,
      [contractId]
    );

    await connection.query(
      `UPDATE jobs SET status = 'COMPLETED' WHERE job_id = ?`,
      [contract.job_id]
    );

    await connection.query(
      `INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, review_text)
       VALUES (?, ?, ?, ?, ?)`,
      [contractId, customerId, contract.technician_id, rating, reviewText || 'Job completed.']
    );

    const [[metrics]] = await connection.query(
      `SELECT 
         COUNT(*) AS total_contracts,
         SUM(CASE WHEN contract_status = 'SETTLED' THEN 1 ELSE 0 END) AS settled_contracts,
         SUM(CASE WHEN contract_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_contracts
       FROM job_contracts WHERE technician_id = ?`,
      [contract.technician_id]
    );

    const [[ratings]] = await connection.query(
      `SELECT COALESCE(AVG(rating), 5.0) AS avg_rating FROM reviews WHERE reviewee_id = ?`,
      [contract.technician_id]
    );

    const [[disputes]] = await connection.query(
      `SELECT COUNT(*) AS total_disputes FROM disputes d 
       JOIN job_contracts jc ON d.contract_id = jc.contract_id 
       WHERE jc.technician_id = ?`,
      [contract.technician_id]
    );

    const total = metrics.total_contracts || 1;
    const settled = metrics.settled_contracts || 1;
    const completionRate = (settled / total) * 100;
    const avgRating = Number(ratings.avg_rating) || 5.0;
    const disputeCount = Number(disputes.total_disputes) || 0;
    const cancellationCount = Number(metrics.cancelled_contracts) || 0;

    let updatedTrustScore = (completionRate * 0.4) + (avgRating * 10 * 0.4) - (disputeCount * 5) - (cancellationCount * 2);
    updatedTrustScore = Math.max(0, Math.min(100, Math.round(updatedTrustScore * 100) / 100));

    await connection.query(
      `UPDATE technician_profiles SET base_trust_score = ? WHERE technician_id = ?`,
      [updatedTrustScore, contract.technician_id]
    );

    await connection.commit();

    const totalPaid = Number(contract.stage1_visit_fee) + Number(contract.stage2_final_labor);

    emitToUser(contract.technician_id, 'job:settled', {
      contractId,
      totalPaid,
      rating,
      updatedTrustScore
    });

    emitToJobRoom(contract.job_id, 'job:completed_full', { contractId, totalPaid });

    return res.status(200).json({
      success: true,
      message: 'Job completed & settled!',
      data: { totalPaid, updatedTrustScore }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// Privacy-Safe 30-Day Completed Job History (NO Phone, NO Exact Address)
export const get30DayHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    if (role === 'CUSTOMER') {
      const query = `
        SELECT 
          jc.contract_id AS contractId,
          j.title,
          sc.name AS categoryName,
          jc.stage1_visit_fee AS visitFee,
          jc.stage2_final_labor AS laborFee,
          (jc.stage1_visit_fee + jc.stage2_final_labor) AS totalAmount,
          jc.completed_at AS completedAt,
          r.rating,
          r.review_text AS reviewText,
          CONCAT(u_t.first_name, ' ', u_t.last_name) AS otherPartyName,
          u_t.avatar_url AS otherPartyAvatar
        FROM job_contracts jc
        JOIN jobs j ON jc.job_id = j.job_id
        JOIN users u_t ON jc.technician_id = u_t.user_id
        JOIN service_categories sc ON j.category_id = sc.category_id
        LEFT JOIN reviews r ON jc.contract_id = r.contract_id
        WHERE j.customer_id = ? 
          AND jc.contract_status = 'SETTLED'
          AND jc.completed_at >= (NOW() - INTERVAL 30 DAY)
        ORDER BY jc.completed_at DESC;
      `;
      const [history] = await pool.query(query, [userId]);
      return res.status(200).json({ success: true, data: history });
    } else {
      const query = `
        SELECT 
          jc.contract_id AS contractId,
          j.title,
          sc.name AS categoryName,
          jc.stage1_visit_fee AS visitFee,
          jc.stage2_final_labor AS laborFee,
          (jc.stage1_visit_fee + jc.stage2_final_labor) AS totalAmount,
          jc.completed_at AS completedAt,
          r.rating,
          r.review_text AS reviewText,
          CONCAT(u_c.first_name, ' ', LEFT(u_c.last_name, 1), '.') AS otherPartyName,
          u_c.avatar_url AS otherPartyAvatar
        FROM job_contracts jc
        JOIN jobs j ON jc.job_id = j.job_id
        JOIN users u_c ON j.customer_id = u_c.user_id
        JOIN service_categories sc ON j.category_id = sc.category_id
        LEFT JOIN reviews r ON jc.contract_id = r.contract_id
        WHERE jc.technician_id = ? 
          AND jc.contract_status = 'SETTLED'
          AND jc.completed_at >= (NOW() - INTERVAL 30 DAY)
        ORDER BY jc.completed_at DESC;
      `;
      const [history] = await pool.query(query, [userId]);
      return res.status(200).json({ success: true, data: history });
    }
  } catch (err) {
    next(err);
  }
};
