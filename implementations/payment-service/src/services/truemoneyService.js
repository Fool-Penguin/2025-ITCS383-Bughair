/**
 * True Money Wallet Payment Service — Sandbox / Mock
 *
 * True Money (Ascend Money) real integration uses:
 *   - REST API with HMAC-SHA256 request signing
 *   - QR-code or mobile-number based flows
 *
 * This mock mirrors the True Money Wallet API structure so
 * replacing the mock with the real SDK requires minimal changes.
 */

const crypto = require("crypto");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Generate HMAC-SHA256 signature (used in real TrueMoney integration).
 */
function generateSignature(payload, secret) {
  return crypto
    .createHmac("sha256", secret || process.env.TRUEMONEY_SECRET || "mock_secret")
    .update(typeof payload === "string" ? payload : JSON.stringify(payload))
    .digest("hex");
}

/**
 * Validate a Thai mobile number (TrueMoney wallet identifier).
 * Format: 10-digit number starting with 06, 08, or 09.
 */
function validateMobileNumber(mobile) {
  const cleaned = String(mobile || "").replace(/[^0-9]/g, "");
  if (!/^(06|08|09)\d{8}$/.test(cleaned)) {
    return "Mobile number must be a valid 10-digit Thai number (06x/08x/09x)";
  }
  return null;
}

/**
 * Step 1 — Request a payment (QR or mobile-number flow).
 * Returns: { success, transactionRef, qrData?, mobilePrompt? }
 */
async function requestTrueMoneyPayment({ amount, currency, mobileNumber, description, idempotencyKey }) {
  await sleep(350);

  const mobileError = validateMobileNumber(mobileNumber);
  if (mobileError) {
    return { success: false, failureReason: mobileError };
  }

  if (!amount || amount <= 0) {
    return { success: false, failureReason: "Invalid amount" };
  }

  const transactionRef = `TMW_REF_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const signature = generateSignature({ transactionRef, amount, mobileNumber }, process.env.TRUEMONEY_SECRET);

  // Mock: numbers ending in "0000" are declined (test scenario)
  const cleaned = String(mobileNumber).replace(/[^0-9]/g, "");
  if (cleaned.endsWith("0000")) {
    return {
      success: false,
      failureReason: "TrueMoney Wallet: insufficient balance (sandbox test)",
      gatewayResponse: { status: "FAILED", code: "INSUFFICIENT_BALANCE", ref: transactionRef },
    };
  }

  return {
    success: true,
    transactionRef,
    // QR payload (real TMW returns a QR string the client renders)
    qrData: `truemoney://payment?ref=${transactionRef}&amount=${amount}&merchant=${process.env.TRUEMONEY_MERCHANT_ID || "mock_merchant"}`,
    gatewayResponse: {
      status: "PENDING",
      transactionRef,
      amount,
      currency,
      mobileNumber: `${cleaned.slice(0, 3)}XXXXX${cleaned.slice(-2)}`, // masked
      description,
      signature,
      expireAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5-min window
    },
  };
}

/**
 * Step 2 — Confirm / verify a TrueMoney payment after user action.
 * In a real flow the gateway sends a webhook; here the client polls.
 */
async function confirmTrueMoneyPayment({ transactionRef }) {
  await sleep(250);

  if (!transactionRef) {
    return { success: false, failureReason: "transactionRef is required" };
  }

  if (transactionRef.includes("FAIL")) {
    return {
      success: false,
      failureReason: "TrueMoney Wallet: payment not approved",
      gatewayResponse: { status: "FAILED", ref: transactionRef },
    };
  }

  const referenceId = `TMW_CONFIRM_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return {
    success: true,
    referenceId,
    gatewayResponse: {
      status: "SUCCESS",
      transactionRef,
      referenceId,
      confirmedAt: new Date().toISOString(),
    },
  };
}

/**
 * Refund a TrueMoney payment.
 */
async function refundTrueMoneyPayment({ referenceId, amount }) {
  await sleep(200);
  const refundRef = `TMW_REFUND_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return {
    success: true,
    referenceId: refundRef,
    gatewayResponse: {
      status: "SUCCESS",
      originalRef: referenceId,
      refundRef,
      amount,
      refundedAt: new Date().toISOString(),
    },
  };
}

module.exports = {
  requestTrueMoneyPayment,
  confirmTrueMoneyPayment,
  refundTrueMoneyPayment,
  validateMobileNumber,
  generateSignature,
};
