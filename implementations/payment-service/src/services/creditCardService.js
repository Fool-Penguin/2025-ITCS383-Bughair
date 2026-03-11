/**
 * Credit Card Payment Service — Stripe (Sandbox / Mock)
 *
 * In production replace the mock functions with the real Stripe SDK:
 *   npm install stripe
 *   const Stripe = require('stripe');
 *   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
 */

// Simulates network latency of a real gateway
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Validate a credit-card payload (basic Luhn-style check for sandbox).
 */
function validateCardPayload(cardDetails) {
  const { cardNumber, expiryMonth, expiryYear, cvv, cardHolderName } = cardDetails;
  const errors = [];

  if (!cardHolderName || cardHolderName.trim().length < 2) {
    errors.push("cardHolderName is required");
  }

  const cleaned = String(cardNumber || "").replace(/\s+/g, "");
  if (!/^\d{16}$/.test(cleaned)) {
    errors.push("cardNumber must be 16 digits");
  }

  const month = parseInt(expiryMonth, 10);
  const year = parseInt(expiryYear, 10);
  const now = new Date();
  if (month < 1 || month > 12) errors.push("expiryMonth must be 1-12");
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    errors.push("Card has expired");
  }

  if (!/^\d{3,4}$/.test(String(cvv || ""))) {
    errors.push("cvv must be 3 or 4 digits");
  }

  return errors;
}

/**
 * Process a credit card payment via Stripe (mock).
 *
 * Returns: { success, referenceId, gatewayResponse, failureReason? }
 */
async function processCreditCardPayment({ amount, currency, cardDetails, description, idempotencyKey }) {
  await sleep(300); // simulate gateway latency

  const validationErrors = validateCardPayload(cardDetails);
  if (validationErrors.length > 0) {
    return {
      success: false,
      failureReason: validationErrors.join("; "),
      gatewayResponse: { error: { type: "card_error", message: validationErrors.join("; ") } },
    };
  }

  const cleaned = String(cardDetails.cardNumber).replace(/\s+/g, "");

  // Sandbox card rules (mirrors Stripe test card behaviour)
  const DECLINED_CARDS = {
    "4000000000000002": "Your card was declined.",
    "4000000000009995": "Your card has insufficient funds.",
    "4000000000000069": "Your card has expired.",
    "4000000000000127": "The CVC code is incorrect.",
  };

  if (DECLINED_CARDS[cleaned]) {
    return {
      success: false,
      failureReason: DECLINED_CARDS[cleaned],
      gatewayResponse: { error: { type: "card_error", code: "card_declined", message: DECLINED_CARDS[cleaned] } },
    };
  }

  // All other cards succeed
  const referenceId = `ch_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    success: true,
    referenceId,
    gatewayResponse: {
      id: referenceId,
      object: "charge",
      amount: Math.round(amount * 100), // Stripe uses smallest currency unit
      currency: currency.toLowerCase(),
      description,
      status: "succeeded",
      paid: true,
      idempotencyKey,
    },
  };
}

/**
 * Refund via Stripe (mock).
 */
async function refundCreditCardPayment({ referenceId, amount }) {
  await sleep(200);
  const refundId = `re_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    success: true,
    referenceId: refundId,
    gatewayResponse: {
      id: refundId,
      object: "refund",
      charge: referenceId,
      amount: Math.round(amount * 100),
      status: "succeeded",
    },
  };
}

module.exports = { processCreditCardPayment, refundCreditCardPayment, validateCardPayload };
