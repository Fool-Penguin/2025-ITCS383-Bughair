const { randomUUID: uuidv4 } = require("crypto");

// Lazy getter — avoids circular dependency at module load time
function db() {
  return require("../config/database").db;
}

const TX     = `payment_svc."payment_transactions"`;
const REF    = `payment_svc."payment_refunds"`;
const PLANS  = `payment_svc."membership_plans"`;

// Create

async function createTransaction({ memberId, paymentMethod, purpose, amount, currency = "THB", idempotencyKey, metadata }) {
  const id = uuidv4();
  await db().query(
    `INSERT INTO ${TX}
       (id, member_id, payment_method, purpose, amount, currency, status, idempotency_key, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,'PENDING',$7,$8)`,
    [id, memberId, paymentMethod, purpose, amount, currency, idempotencyKey, metadata ? JSON.stringify(metadata) : null]
  );
  return findById(id);
}

// Read

async function findById(id) {
  const { rows } = await db().query(`SELECT * FROM ${TX} WHERE id = $1`, [id]);
  return rows[0] ? parse(rows[0]) : null;
}

async function findByIdempotencyKey(key) {
  const { rows } = await db().query(`SELECT * FROM ${TX} WHERE idempotency_key = $1`, [key]);
  return rows[0] ? parse(rows[0]) : null;
}

async function findByMember(memberId, { limit = 20, offset = 0, status } = {}) {
  const params = [memberId];
  let sql = `SELECT * FROM ${TX} WHERE member_id = $1`;
  if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
  params.push(limit); sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
  params.push(offset); sql += ` OFFSET $${params.length}`;
  const { rows } = await db().query(sql, params);
  return rows.map(parse);
}

async function findAll({ limit = 50, offset = 0, status, paymentMethod, purpose, startDate, endDate } = {}) {
  const params = [];
  let sql = `SELECT * FROM ${TX} WHERE 1=1`;
  if (status)        { params.push(status);         sql += ` AND status = $${params.length}`; }
  if (paymentMethod) { params.push(paymentMethod);  sql += ` AND payment_method = $${params.length}`; }
  if (purpose)       { params.push(purpose);        sql += ` AND purpose = $${params.length}`; }
  if (startDate)     { params.push(startDate);      sql += ` AND created_at >= $${params.length}`; }
  if (endDate)       { params.push(endDate);        sql += ` AND created_at <= $${params.length}`; }
  params.push(limit); sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
  params.push(offset); sql += ` OFFSET $${params.length}`;
  const { rows } = await db().query(sql, params);
  return rows.map(parse);
}

// Update

async function updateStatus(id, status, { referenceId, failureReason } = {}) {
  const completedAt = ["SUCCESS", "FAILED", "REFUNDED", "CANCELLED"].includes(status)
    ? new Date().toISOString() : null;
  await db().query(
    `UPDATE ${TX}
        SET status = $1,
            reference_id   = COALESCE($2, reference_id),
            failure_reason = COALESCE($3, failure_reason),
            completed_at   = COALESCE($4::timestamptz, completed_at),
            updated_at     = NOW()
      WHERE id = $5`,
    [status, referenceId || null, failureReason || null, completedAt, id]
  );
  return findById(id);
}

async function updateToProcessing(id) {
  return updateStatus(id, "PROCESSING");
}

// Refunds

async function createRefund({ transactionId, adminId, amount, reason }) {
  const id = uuidv4();
  await db().query(
    `INSERT INTO ${REF} (id, transaction_id, admin_id, amount, reason)
     VALUES ($1,$2,$3,$4,$5)`,
    [id, transactionId, adminId, amount, reason]
  );
  return findRefundById(id);
}

async function findRefundById(id) {
  const { rows } = await db().query(`SELECT * FROM ${REF} WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function updateRefundStatus(id, status, referenceId) {
  await db().query(
    `UPDATE ${REF}
        SET status = $1,
            reference_id = COALESCE($2, reference_id),
            updated_at = NOW()
      WHERE id = $3`,
    [status, referenceId || null, id]
  );
  return findRefundById(id);
}

async function findRefundsByTransaction(transactionId) {
  const { rows } = await db().query(`SELECT * FROM ${REF} WHERE transaction_id = $1`, [transactionId]);
  return rows;
}

// Reports

async function getFinancialSummary({ startDate, endDate } = {}) {
  const params = [];
  let condition = "WHERE status = 'SUCCESS'";
  if (startDate) { params.push(startDate); condition += ` AND created_at >= $${params.length}`; }
  if (endDate)   { params.push(endDate);   condition += ` AND created_at <= $${params.length}`; }

  const totalRes = await db().query(
    `SELECT COUNT(*)::int AS count, COALESCE(SUM(amount),0) AS total, currency
       FROM ${TX} ${condition} GROUP BY currency`,
    params
  );
  const byMethodRes = await db().query(
    `SELECT payment_method, COUNT(*)::int AS count, COALESCE(SUM(amount),0) AS total
       FROM ${TX} ${condition} GROUP BY payment_method`,
    params
  );
  const byPurposeRes = await db().query(
    `SELECT purpose, COUNT(*)::int AS count, COALESCE(SUM(amount),0) AS total
       FROM ${TX} ${condition} GROUP BY purpose`,
    params
  );
  const dailyRes = await db().query(
    `SELECT DATE(created_at)::text AS date, COUNT(*)::int AS count, COALESCE(SUM(amount),0) AS total
       FROM ${TX} ${condition}
       GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`,
    params
  );

  return {
    total: totalRes.rows,
    byMethod: byMethodRes.rows,
    byPurpose: byPurposeRes.rows,
    daily: dailyRes.rows,
  };
}

// Plans

async function getActivePlans() {
  const { rows } = await db().query(`SELECT * FROM ${PLANS} WHERE is_active = 1`);
  return rows;
}

async function getPlanById(id) {
  const { rows } = await db().query(`SELECT * FROM ${PLANS} WHERE id = $1 AND is_active = 1`, [id]);
  return rows[0] || null;
}

// Helper

function parse(row) {
  if (!row) return null;
  let metadata = null;
  if (row.metadata) {
    try { metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata; }
    catch { metadata = null; }
  }
  return { ...row, metadata };
}

module.exports = {
  createTransaction,
  findById,
  findByIdempotencyKey,
  findByMember,
  findAll,
  updateStatus,
  updateToProcessing,
  createRefund,
  findRefundById,
  updateRefundStatus,
  findRefundsByTransaction,
  getFinancialSummary,
  getActivePlans,
  getPlanById,
};
