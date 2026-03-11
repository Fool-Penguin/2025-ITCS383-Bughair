const { v4: uuidv4 } = require("uuid");

// Lazy getter — avoids circular dependency at module load time
function db() {
  return require("../config/database").db;
}

// Create

function createTransaction({ memberId, paymentMethod, purpose, amount, currency = "THB", idempotencyKey, metadata }) {
  const id = uuidv4();
  db().prepare(`
    INSERT INTO payment_transactions
      (id, member_id, payment_method, purpose, amount, currency, status, idempotency_key, metadata)
    VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
  `).run(id, memberId, paymentMethod, purpose, amount, currency, idempotencyKey, metadata ? JSON.stringify(metadata) : null);
  return findById(id);
}

// Read

function findById(id) {
  const row = db().prepare("SELECT * FROM payment_transactions WHERE id = ?").get(id);
  return row ? parse(row) : null;
}

function findByIdempotencyKey(key) {
  const row = db().prepare("SELECT * FROM payment_transactions WHERE idempotency_key = ?").get(key);
  return row ? parse(row) : null;
}

function findByMember(memberId, { limit = 20, offset = 0, status } = {}) {
  let sql = "SELECT * FROM payment_transactions WHERE member_id = ?";
  const params = [memberId];
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  return db().prepare(sql).all(...params).map(parse);
}

function findAll({ limit = 50, offset = 0, status, paymentMethod, purpose, startDate, endDate } = {}) {
  let sql = "SELECT * FROM payment_transactions WHERE 1=1";
  const params = [];
  if (status)        { sql += " AND status = ?";         params.push(status); }
  if (paymentMethod) { sql += " AND payment_method = ?"; params.push(paymentMethod); }
  if (purpose)       { sql += " AND purpose = ?";        params.push(purpose); }
  if (startDate)     { sql += " AND created_at >= ?";    params.push(startDate); }
  if (endDate)       { sql += " AND created_at <= ?";    params.push(endDate); }
  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  return db().prepare(sql).all(...params).map(parse);
}

// Update

function updateStatus(id, status, { referenceId, failureReason } = {}) {
  const completedAt = ["SUCCESS", "FAILED", "REFUNDED", "CANCELLED"].includes(status)
    ? new Date().toISOString() : null;
  db().prepare(`
    UPDATE payment_transactions
    SET status = ?,
        reference_id   = COALESCE(?, reference_id),
        failure_reason = COALESCE(?, failure_reason),
        completed_at   = COALESCE(?, completed_at),
        updated_at     = datetime('now')
    WHERE id = ?
  `).run(status, referenceId || null, failureReason || null, completedAt, id);
  return findById(id);
}

function updateToProcessing(id) {
  return updateStatus(id, "PROCESSING");
}

// Refunds

function createRefund({ transactionId, adminId, amount, reason }) {
  const id = uuidv4();
  db().prepare(`
    INSERT INTO payment_refunds (id, transaction_id, admin_id, amount, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, transactionId, adminId, amount, reason);
  return findRefundById(id);
}

function findRefundById(id) {
  return db().prepare("SELECT * FROM payment_refunds WHERE id = ?").get(id);
}

function updateRefundStatus(id, status, referenceId) {
  db().prepare(`
    UPDATE payment_refunds
    SET status = ?, reference_id = COALESCE(?, reference_id), updated_at = datetime('now')
    WHERE id = ?
  `).run(status, referenceId || null, id);
  return findRefundById(id);
}

function findRefundsByTransaction(transactionId) {
  return db().prepare("SELECT * FROM payment_refunds WHERE transaction_id = ?").all(transactionId);
}

// Reports

function getFinancialSummary({ startDate, endDate } = {}) {
  let condition = "WHERE status = 'SUCCESS'";
  const params = [];
  if (startDate) { condition += " AND created_at >= ?"; params.push(startDate); }
  if (endDate)   { condition += " AND created_at <= ?"; params.push(endDate); }

  const total = db().prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total, currency
    FROM payment_transactions ${condition} GROUP BY currency
  `).all(...params);

  const byMethod = db().prepare(`
    SELECT payment_method, COUNT(*) as count, COALESCE(SUM(amount),0) as total
    FROM payment_transactions ${condition} GROUP BY payment_method
  `).all(...params);

  const byPurpose = db().prepare(`
    SELECT purpose, COUNT(*) as count, COALESCE(SUM(amount),0) as total
    FROM payment_transactions ${condition} GROUP BY purpose
  `).all(...params);

  const daily = db().prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(amount),0) as total
    FROM payment_transactions ${condition}
    GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30
  `).all(...params);

  return { total, byMethod, byPurpose, daily };
}

// Plans

function getActivePlans() {
  return db().prepare("SELECT * FROM membership_plans WHERE is_active = 1").all();
}

function getPlanById(id) {
  return db().prepare("SELECT * FROM membership_plans WHERE id = ? AND is_active = 1").get(id);
}

// Helper

function parse(row) {
  if (!row) return null;
  return { ...row, metadata: row.metadata ? JSON.parse(row.metadata) : null };
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