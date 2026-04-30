const { randomUUID: uuidv4 } = require("crypto");
const { db } = require("../config/database");

const AUDIT = `payment_svc."audit_logs"`;

/**
 * Write an entry to the audit_logs table. Fire-and-forget — never throws.
 */
function auditLog({ actorId, actorRole, action, entity, entityId, details, ip }) {
  db.query(
    `INSERT INTO ${AUDIT} (id, actor_id, actor_role, action, entity, entity_id, details, ip_address)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      uuidv4(),
      actorId,
      actorRole,
      action,
      entity,
      entityId || null,
      details ? JSON.stringify(details) : null,
      ip || null,
    ]
  ).catch((err) => {
    // Non-fatal — log to console but don't crash the request
    console.error("Audit log error:", err.message);
  });
}

module.exports = { auditLog };
