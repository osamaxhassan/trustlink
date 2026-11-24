import { pool } from '../config/db.js';
import { SpatialService } from '../services/spatial.service.js';
import { emitToUser, emitToJobRoom } from '../sockets/socketEmitter.js';

export const createJob = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { customerId, categoryId, title, description, lng, lat, addressText } = req.body;
    const files = req.files || [];

    const [existing] = await connection.query(
      `SELECT job_id FROM jobs 
       WHERE customer_id = ? AND status IN ('SEARCHING', 'OFFERS_RECEIVED', 'LOCKED_STAGE_1', 'LOCKED_STAGE_2') LIMIT 1`,
      [customerId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `You already have an active request (Job #${existing[0].job_id}). Please complete or cancel it before posting a new one.`
      });
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO jobs (customer_id, category_id, title, description, location, address_text, search_radius_km, status)
       VALUES (?, ?, ?, ?, POINT(?, ?), ?, 5.0, 'SEARCHING')`,
      [customerId, categoryId, title, description, lng, lat, addressText]
    );

    const jobId = result.insertId;

    const mediaUrls = [];
    for (const file of files) {
      const mediaUrl = `http://localhost:5000/uploads/${file.filename}`;
      mediaUrls.push(mediaUrl);
      await connection.query(
        `INSERT INTO job_media (job_id, media_type, media_url) VALUES (?, 'IMAGE', ?)`,
        [jobId, mediaUrl]
      );
    }

    await connection.commit();

    const nearbyTechs = await SpatialService.findNearbyTechnicians(jobId);
    nearbyTechs.forEach((tech) => {
      emitToUser(tech.technician_id, 'job:new_nearby', {
        jobId,
        title,
        description,
        addressText,
        distanceKm: tech.distance_km,
        categoryId,
        mediaUrls
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Job broadcasted',
      data: { jobId, mediaUrls, alertedTechniciansCount: nearbyTechs.length }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const getCustomerActiveJob = async (req, res, next) => {
  try {
    const customerId = req.user.userId;

    const [jobs] = await pool.query(
      `SELECT *, TIMESTAMPDIFF(SECOND, created_at, NOW()) AS elapsed_seconds
       FROM jobs 
       WHERE customer_id = ? AND status IN ('SEARCHING', 'OFFERS_RECEIVED', 'LOCKED_STAGE_1', 'LOCKED_STAGE_2')
       ORDER BY 
         CASE status 
           WHEN 'LOCKED_STAGE_2' THEN 1 
           WHEN 'LOCKED_STAGE_1' THEN 2 
           WHEN 'OFFERS_RECEIVED' THEN 3 
           WHEN 'SEARCHING' THEN 4 
           ELSE 5 
         END, 
         created_at DESC 
       LIMIT 1`,
      [customerId]
    );

    if (jobs.length === 0) return res.status(200).json({ success: true, data: null });

    const activeJob = jobs[0];

    if (activeJob.elapsed_seconds >= 1800 && (activeJob.status === 'SEARCHING' || activeJob.status === 'OFFERS_RECEIVED')) {
      await pool.query("UPDATE jobs SET status = 'CANCELLED' WHERE job_id = ?", [activeJob.job_id]);
      await pool.query("UPDATE bids SET status = 'WITHDRAWN' WHERE job_id = ?", [activeJob.job_id]);
      emitToJobRoom(activeJob.job_id, 'job:cancelled', { jobId: activeJob.job_id, reason: 'Request timed out after 30 minutes.' });
      return res.status(200).json({ success: true, data: null });
    }

    const [media] = await pool.query(`SELECT media_url FROM job_media WHERE job_id = ?`, [activeJob.job_id]);

    // Calculate real distance_km for each received bid
    const [bids] = await pool.query(
      `SELECT b.*, 
              CONCAT(u.first_name, ' ', u.last_name) AS name, 
              u.avatar_url AS technicianAvatar,
              tp.base_trust_score AS trustScore,
              TIMESTAMPDIFF(SECOND, b.created_at, NOW()) AS bid_elapsed_seconds,
              ROUND(ST_Distance_Sphere(tp.last_known_location, j.location) / 1000, 2) AS distance_km
       FROM bids b
       JOIN users u ON b.technician_id = u.user_id
       JOIN technician_profiles tp ON b.technician_id = tp.technician_id
       JOIN jobs j ON j.job_id = b.job_id
       WHERE b.job_id = ? 
         AND b.status = 'SUBMITTED' 
         AND TIMESTAMPDIFF(SECOND, b.created_at, NOW()) < 300
       ORDER BY b.created_at DESC`,
      [activeJob.job_id]
    );

    const [contracts] = await pool.query(
      `SELECT contract_id, job_id, technician_id, stage1_visit_fee, stage2_final_labor, stage2_pin, contract_status 
       FROM job_contracts WHERE job_id = ? LIMIT 1`,
      [activeJob.job_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        job: { 
          ...activeJob, 
          mediaUrls: media.map(m => m.media_url),
          remainingSeconds: Math.max(0, 1800 - activeJob.elapsed_seconds)
        },
        bids: bids.map(b => ({
          bidId: b.bid_id,
          jobId: b.job_id,
          technicianId: b.technician_id,
          name: b.name,
          technicianAvatar: b.technicianAvatar,
          trustScore: b.trustScore,
          visitFee: b.visit_fee,
          estimatedLaborMin: b.estimated_labor_min,
          estimatedLaborMax: b.estimated_labor_max,
          status: b.status,
          offerRemainingSeconds: Math.max(0, 300 - b.bid_elapsed_seconds),
          distanceKm: Number(b.distance_km) // Exact real distance!
        })),
        contract: contracts[0] ? {
          ...contracts[0],
          stage2VerificationPin: contracts[0].stage2_pin
        } : null
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getAvailableJobsForTechnician = async (req, res, next) => {
  try {
    const techId = req.user.userId;

    const [[techProfile]] = await pool.query(
      'SELECT is_verified, rejection_reason, base_trust_score FROM technician_profiles WHERE technician_id = ?',
      [techId]
    );

    if (!techProfile || !techProfile.is_verified) {
      return res.status(200).json({ 
        success: true, 
        data: [], 
        isVerified: false,
        rejectionReason: techProfile?.rejection_reason || null,
        message: 'Account pending admin CNIC verification.' 
      });
    }

    const query = `
      SELECT 
        j.job_id AS jobId,
        j.title,
        j.description,
        j.address_text AS addressText,
        j.category_id AS categoryId,
        sc.name AS categoryName,
        b.bid_id AS myBidId,
        b.visit_fee AS myVisitFee,
        b.status AS myBidStatus,
        TIMESTAMPDIFF(SECOND, b.created_at, NOW()) AS myBidElapsedSeconds,
        ROUND(ST_Distance_Sphere(tp.last_known_location, j.location) / 1000, 2) AS distanceKm,
        (SELECT GROUP_CONCAT(media_url) FROM job_media WHERE job_id = j.job_id) AS mediaUrlsConcat
      FROM jobs j
      JOIN technician_services ts ON j.category_id = ts.category_id
      JOIN technician_profiles tp ON tp.technician_id = ?
      JOIN service_categories sc ON j.category_id = sc.category_id
      LEFT JOIN bids b ON b.job_id = j.job_id AND b.technician_id = ?
      WHERE ts.technician_id = ?
        AND j.status IN ('SEARCHING', 'OFFERS_RECEIVED')
        AND ST_Distance_Sphere(tp.last_known_location, j.location) <= (j.search_radius_km * 1000)
      ORDER BY j.created_at DESC;
    `;

    const [availableJobs] = await pool.query(query, [techId, techId, techId]);

    const formattedJobs = availableJobs.map(j => {
      const isExpired = j.myBidElapsedSeconds >= 300;
      return {
        ...j,
        myBidStatus: isExpired ? null : j.myBidStatus,
        myBidRemainingSeconds: isExpired ? 0 : Math.max(0, 300 - (j.myBidElapsedSeconds || 0)),
        mediaUrls: j.mediaUrlsConcat ? j.mediaUrlsConcat.split(',') : []
      };
    });

    return res.status(200).json({ 
      success: true, 
      data: formattedJobs, 
      isVerified: true, 
      trustScore: techProfile.base_trust_score 
    });
  } catch (err) {
    next(err);
  }
};

export const cancelJob = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { jobId, cancelReason } = req.body;
    const customerId = req.user.userId;

    await connection.beginTransaction();

    const [[job]] = await connection.query(
      `SELECT status FROM jobs WHERE job_id = ? AND customer_id = ? FOR UPDATE`,
      [jobId, customerId]
    );

    if (!job) throw new Error('Job not found or unauthorized.');
    if (job.status === 'LOCKED_STAGE_2' || job.status === 'COMPLETED') {
      throw new Error('Cannot cancel a job that is already in Stage 2 progress.');
    }

    await connection.query(`UPDATE jobs SET status = 'CANCELLED' WHERE job_id = ?`, [jobId]);
    await connection.query(`UPDATE bids SET status = 'WITHDRAWN' WHERE job_id = ?`, [jobId]);
    await connection.query(`UPDATE job_contracts SET contract_status = 'CANCELLED' WHERE job_id = ?`, [jobId]);

    await connection.commit();

    emitToJobRoom(jobId, 'job:cancelled', { jobId, reason: cancelReason });

    return res.status(200).json({ success: true, message: 'Service request cancelled.' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};
