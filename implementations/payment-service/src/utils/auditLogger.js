const { v4: uuidv4 } = require("uuid");
const { db } = require("../config/database");

/**
 * Write an entry to the audit_logs table.
 * @param {object} params
 * @param {string} params.actorId   - member_id or admin_id performing the action
 * @param {string} params.actorRole - 'MEMBER' | 'ADMIN' | 'SYSTEM'
 * @param {string} params.action    - e.g. 'INITIATE_PAYMENT', 'REFUND'
 * @param {string} params.entity    - table / domain, e.g. 'payment_transactions'
 * @param {string} [params.entityId]
 * @param {object} [params.details] - extra JSON-serialisable info
 * @param {string} [params.ip]
 */
function auditLog({ actorId, actorRole, action, entity, entityId, details, ip }) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_role, action, entity, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      actorId,
      actorRole,
      action,
      entity,
      entityId || null,
      details ? JSON.stringify(details) : null,
      ip || null
    );
  } catch (err) {
    // Non-fatal — log to console but don't crash the request
    console.error("Audit log error:", err.message);
  }
}

module.exports = { auditLog };
