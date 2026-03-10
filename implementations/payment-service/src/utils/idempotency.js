const crypto = require("crypto");

/**
 * Generate a deterministic idempotency key to prevent duplicate payments.
 * The key is derived from: memberId + purpose + amount + date (YYYYMMDD).
 * Callers can pass an explicit suffix (e.g. plan ID) for extra uniqueness.
 *
 * @param {string} memberId
 * @param {string} purpose  - 'MEMBERSHIP' | 'COURSE' | 'TRAINING' | 'COURT'
 * @param {number} amount
 * @param {string} [suffix] - optional extra discriminator
 * @returns {string} hex hash
 */
function generateIdempotencyKey(memberId, purpose, amount, suffix = "") {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const raw = `${memberId}:${purpose}:${amount}:${today}:${suffix}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Accept a client-supplied idempotency key (UUID or arbitrary string) and
 * normalise it to a fixed-length hex string.
 */
function normaliseKey(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

module.exports = { generateIdempotencyKey, normaliseKey };
