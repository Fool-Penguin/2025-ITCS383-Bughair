/**
 * Lightweight auth middleware.
 *
 * Expected header:  Authorization: Bearer <token>
 *
 * Mock token format (base64-encoded JSON):
 *   { "sub": "<id>", "role": "MEMBER|ADMIN", "name": "<name>" }
 *
 * Example token for a member:
 *   btoa(JSON.stringify({ sub:"member_001", role:"MEMBER", name:"Alice" }))
 *
 * Example token for an admin:
 *   btoa(JSON.stringify({ sub:"admin_001", role:"ADMIN", name:"Bob" }))
 */

const { errorResponse } = require("../utils/responseHelper");

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, "Missing or invalid Authorization header", 401);
  }

  const token = authHeader.slice(7);
  try {
    // Mock JWT decode (base64 JSON)
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    if (!decoded.sub || !decoded.role) throw new Error("Invalid payload");

    req.user = {
      id: decoded.sub,
      role: decoded.role,
      name: decoded.name || "Unknown",
    };
    next();
  } catch {
    return errorResponse(res, "Invalid or expired token", 401);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return errorResponse(res, "Unauthenticated", 401);
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, "Forbidden: insufficient permissions", 403);
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
