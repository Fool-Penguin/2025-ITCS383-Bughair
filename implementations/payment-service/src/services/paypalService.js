/**
 * PayPal Payment Service — Sandbox / Mock
 *
 * In production replace mock functions with the official PayPal REST SDK:
 *   npm install @paypal/checkout-server-sdk
 *
 * PayPal flow used here:
 *   1. createOrder  → returns an approvalUrl the client opens
 *   2. captureOrder → called after the user approves in PayPal
 */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const SANDBOX_BASE = "https://api-m.sandbox.paypal.com"; // not called in mock

/**
 * Step 1 — Create a PayPal order.
 * Returns { success, orderId, approvalUrl }
 */
async function createPayPalOrder({ amount, currency, description, returnUrl, cancelUrl }) {
  await sleep(250);

  if (!amount || amount <= 0) {
    return { success: false, failureReason: "Invalid amount" };
  }

  const orderId = `PAYPAL_ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  // In production: POST /v2/checkout/orders
  const approvalUrl = `${SANDBOX_BASE}/checkoutnow?token=${orderId}&redirect=${encodeURIComponent(returnUrl || "")}`;

  return {
    success: true,
    orderId,
    approvalUrl,  // Front-end redirects user here
    gatewayResponse: {
      id: orderId,
      intent: "CAPTURE",
      status: "CREATED",
      purchase_units: [{ amount: { currency_code: currency, value: String(amount.toFixed(2)) }, description }],
      links: [
        { href: approvalUrl, rel: "approve", method: "GET" },
        { href: `${SANDBOX_BASE}/v2/checkout/orders/${orderId}/capture`, rel: "capture", method: "POST" },
      ],
    },
  };
}

/**
 * Step 2 — Capture (complete) a PayPal order after user approval.
 * Returns { success, referenceId, gatewayResponse, failureReason? }
 */
async function capturePayPalOrder({ orderId }) {
  await sleep(300);

  if (!orderId) {
    return { success: false, failureReason: "orderId is required" };
  }

  // Sandbox: orders containing "FAIL" will be declined
  if (orderId.includes("FAIL")) {
    return {
      success: false,
      failureReason: "PayPal order capture failed (sandbox test)",
      gatewayResponse: { name: "UNPROCESSABLE_ENTITY", message: "Order cannot be captured" },
    };
  }

  const captureId = `CAPTURE_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return {
    success: true,
    referenceId: captureId,
    gatewayResponse: {
      id: orderId,
      status: "COMPLETED",
      purchase_units: [
        {
          payments: {
            captures: [{ id: captureId, status: "COMPLETED" }],
          },
        },
      ],
    },
  };
}

/**
 * Refund a captured PayPal payment.
 */
async function refundPayPalPayment({ referenceId, amount, currency }) {
  await sleep(200);
  const refundId = `REFUND_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return {
    success: true,
    referenceId: refundId,
    gatewayResponse: {
      id: refundId,
      status: "COMPLETED",
      amount: { value: String(amount.toFixed(2)), currency_code: currency },
      links: [{ rel: "up", href: `${SANDBOX_BASE}/v2/payments/captures/${referenceId}` }],
    },
  };
}

module.exports = { createPayPalOrder, capturePayPalOrder, refundPayPalPayment };
