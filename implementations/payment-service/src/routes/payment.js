const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const router = express.Router();

const { authenticate, requireRole } = require("../middleware/auth");
const { db } = require("../config/database");
const PaymentModel = require("../models/payment");
const { auditLog } = require("../utils/auditLogger");
const { successResponse, errorResponse } = require("../utils/responseHelper");
const { generateIdempotencyKey, normaliseKey } = require("../utils/idempotency");

const CreditCard = require("../services/creditCardService");
const PayPal = require("../services/paypalService");
const TrueMoney = require("../services/truemoneyService");

const PLANS = `payment_svc."membership_plans"`;

// Validation helper
function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errorResponse(res, "Validation failed", 400, errors.array());
    return false;
  }
  return true;
}

//  PUBLIC ROUTES

/**
 * GET /api/payments/plans
 * List available membership plans and their prices.
 */
router.get("/plans", async (req, res) => {
  try {
    const { rows: plans } = await db.query(`SELECT * FROM ${PLANS} WHERE is_active = 1`);
    return successResponse(res, { plans });
  } catch (err) {
    console.error("Plans error:", err);
    return errorResponse(res, "Failed to load plans", 500);
  }
});

//  MEMBER ROUTES  (require authentication)

/**
 * GET /api/payments/my
 * Get the authenticated member's own payment history.
 */
router.get("/my", authenticate, [
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("offset").optional().isInt({ min: 0 }),
  query("status").optional().isIn(["PENDING","PROCESSING","SUCCESS","FAILED","REFUNDED","CANCELLED"]),
], async (req, res) => {
  if (!validate(req, res)) return;
  const { limit = 20, offset = 0, status } = req.query;
  const transactions = await PaymentModel.findByMember(req.user.id, {
    limit: Number(limit), offset: Number(offset), status,
  });
  return successResponse(res, { transactions, count: transactions.length });
});

/**
 * GET /api/payments/:id
 * Get a specific transaction (member can only see their own).
 */
router.get("/:id", authenticate, [
  param("id").notEmpty(),
], async (req, res) => {
  if (!validate(req, res)) return;
  const tx = await PaymentModel.findById(req.params.id);
  if (!tx) return errorResponse(res, "Transaction not found", 404);
  if (req.user.role !== "ADMIN" && tx.member_id !== req.user.id) {
    return errorResponse(res, "Forbidden", 403);
  }
  const refunds = await PaymentModel.findRefundsByTransaction(tx.id);
  return successResponse(res, { transaction: tx, refunds });
});

//  CREDIT CARD

router.post("/credit-card", authenticate, [
  body("purpose").isIn(["MEMBERSHIP","COURSE","TRAINING","COURT"]),
  body("amount").isFloat({ min: 1 }),
  body("currency").optional().isIn(["THB","USD"]),
  body("planId").optional().isString(),
  body("cardDetails.cardHolderName").notEmpty(),
  body("cardDetails.cardNumber").notEmpty(),
  body("cardDetails.expiryMonth").isInt({ min: 1, max: 12 }),
  body("cardDetails.expiryYear").isInt({ min: new Date().getFullYear() }),
  body("cardDetails.cvv").notEmpty(),
  body("idempotencyKey").optional().isString(),
], async (req, res) => {
  if (!validate(req, res)) return;

  const { purpose, amount, currency = "THB", cardDetails, planId, metadata, idempotencyKey: clientKey } = req.body;

  const iKey = clientKey
    ? normaliseKey(clientKey)
    : generateIdempotencyKey(req.user.id, purpose, amount, planId || "");

  const existing = await PaymentModel.findByIdempotencyKey(iKey);
  if (existing) {
    return successResponse(res, { transaction: existing }, "Duplicate request — returning existing transaction", 200);
  }

  let tx = await PaymentModel.createTransaction({
    memberId: req.user.id, paymentMethod: "CREDIT_CARD",
    purpose, amount, currency, idempotencyKey: iKey,
    metadata: { planId, ...metadata },
  });

  auditLog({ actorId: req.user.id, actorRole: req.user.role, action: "INITIATE_PAYMENT",
    entity: "payment_transactions", entityId: tx.id,
    details: { method: "CREDIT_CARD", amount, purpose }, ip: req.ip });

  await PaymentModel.updateToProcessing(tx.id);
  const result = await CreditCard.processCreditCardPayment({
    amount, currency, cardDetails,
    description: `${purpose} — member ${req.user.id}`,
    idempotencyKey: iKey,
  });

  if (result.success) {
    tx = await PaymentModel.updateStatus(tx.id, "SUCCESS", { referenceId: result.referenceId });
    auditLog({ actorId: req.user.id, actorRole: req.user.role, action: "PAYMENT_SUCCESS",
      entity: "payment_transactions", entityId: tx.id,
      details: { referenceId: result.referenceId }, ip: req.ip });
    return successResponse(res, { transaction: tx, gateway: result.gatewayResponse }, "Payment successful", 200);
  } else {
    tx = await PaymentModel.updateStatus(tx.id, "FAILED", { failureReason: result.failureReason });
    auditLog({ actorId: req.user.id, actorRole: req.user.role, action: "PAYMENT_FAILED",
      entity: "payment_transactions", entityId: tx.id,
      details: { reason: result.failureReason }, ip: req.ip });
    return errorResponse(res, result.failureReason, 402);
  }
});

//  PAYPAL — Step 1: Create Order

router.post("/paypal/create-order", authenticate, [
  body("purpose").isIn(["MEMBERSHIP","COURSE","TRAINING","COURT"]),
  body("amount").isFloat({ min: 1 }),
  body("currency").optional().isIn(["THB","USD"]),
  body("returnUrl").optional().isURL(),
  body("cancelUrl").optional().isURL(),
  body("idempotencyKey").optional().isString(),
], async (req, res) => {
  if (!validate(req, res)) return;

  const { purpose, amount, currency = "THB", returnUrl, cancelUrl, planId, metadata, idempotencyKey: clientKey } = req.body;

  const iKey = clientKey
    ? normaliseKey(clientKey)
    : generateIdempotencyKey(req.user.id, purpose, amount, `paypal:${planId || ""}`);

  const existing = await PaymentModel.findByIdempotencyKey(iKey);
  if (existing && existing.status !== "FAILED") {
    return successResponse(res, { transaction: existing }, "Duplicate request — returning existing transaction");
  }

  let tx = await PaymentModel.createTransaction({
    memberId: req.user.id, paymentMethod: "PAYPAL",
    purpose, amount, currency, idempotencyKey: iKey,
    metadata: { planId, ...metadata },
  });

  auditLog({ actorId: req.user.id, actorRole: req.user.role, action: "INITIATE_PAYMENT",
    entity: "payment_transactions", entityId: tx.id,
    details: { method: "PAYPAL", amount, purpose }, ip: req.ip });

  const result = await PayPal.createPayPalOrder({ amount, currency,
    description: `${purpose} — member ${req.user.id}`, returnUrl, cancelUrl });

  if (result.success) {
    tx = await PaymentModel.updateStatus(tx.id, "PENDING", { referenceId: result.orderId });
    return successResponse(res, {
      transaction: tx,
      orderId: result.orderId,
      approvalUrl: result.approvalUrl,
    }, "PayPal order created — redirect user to approvalUrl");
  } else {
    await PaymentModel.updateStatus(tx.id, "FAILED", { failureReason: result.failureReason });
    return errorResponse(res, result.failureReason, 400);
  }
});

//  PAYPAL — Step 2: Capture Order

router.post("/paypal/capture-order", authenticate, [
  body("transactionId").notEmpty(),
  body("orderId").notEmpty(),
], async (req, res) => {
  if (!validate(req, res)) return;

  const { transactionId, orderId } = req.body;
  let tx = await PaymentModel.findById(transactionId);
  if (!tx) return errorResponse(res, "Transaction not found", 404);
  if (tx.member_id !== req.user.id) return errorResponse(res, "Forbidden", 403);
  if (tx.status !== "PENDING") return errorResponse(res, `Cannot capture a ${tx.status} transaction`, 409);

  await PaymentModel.updateToProcessing(tx.id);
  const result = await PayPal.capturePayPalOrder({ orderId });

  if (result.success) {
    tx = await PaymentModel.updateStatus(tx.id, "SUCCESS", { referenceId: result.referenceId });
    auditLog({ actorId: req.user.id, actorRole: req.user.role, action: "PAYMENT_SUCCESS",
      entity: "payment_transactions", entityId: tx.id,
      details: { method: "PAYPAL", referenceId: result.referenceId }, ip: req.ip });
    return successResponse(res, { transaction: tx, gateway: result.gatewayResponse }, "PayPal payment captured");
  } else {
    tx = await PaymentModel.updateStatus(tx.id, "FAILED", { failureReason: result.failureReason });
    return errorResponse(res, result.failureReason, 402);
  }
});

//  TRUE MONEY WALLET — Step 1: Request Payment

router.post("/truemoney/request", authenticate, [
  body("purpose").isIn(["MEMBERSHIP","COURSE","TRAINING","COURT"]),
  body("amount").isFloat({ min: 1 }),
  body("mobileNumber").notEmpty(),
  body("idempotencyKey").optional().isString(),
], async (req, res) => {
  if (!validate(req, res)) return;

  const { purpose, amount, currency = "THB", mobileNumber, planId, metadata, idempotencyKey: clientKey } = req.body;

  const mobileError = TrueMoney.validateMobileNumber(mobileNumber);
  if (mobileError) return errorResponse(res, mobileError, 400);

  const iKey = clientKey
    ? normaliseKey(clientKey)
    : generateIdempotencyKey(req.user.id, purpose, amount, `tmw:${mobileNumber}`);

  const existing = await PaymentModel.findByIdempotencyKey(iKey);
  if (existing && existing.status !== "FAILED") {
    return successResponse(res, { transaction: existing }, "Duplicate request — returning existing transaction");
  }

  let tx = await PaymentModel.createTransaction({
    memberId: req.user.id, paymentMethod: "TRUEMONEY",
    purpose, amount, currency, idempotencyKey: iKey,
    metadata: { planId, mobileNumber: mobileNumber.replace(/(\d{3})\d{5}(\d{2})/, "$1XXXXX$2"), ...metadata },
  });

  auditLog({ actorId: req.user.id, actorRole: req.user.role, action: "INITIATE_PAYMENT",
    entity: "payment_transactions", entityId: tx.id,
    details: { method: "TRUEMONEY", amount, purpose }, ip: req.ip });

  const result = await TrueMoney.requestTrueMoneyPayment({
    amount, currency, mobileNumber,
    description: `${purpose} — member ${req.user.id}`,
    idempotencyKey: iKey,
  });

  if (result.success) {
    tx = await PaymentModel.updateStatus(tx.id, "PENDING", { referenceId: result.transactionRef });
    return successResponse(res, {
      transaction: tx,
      transactionRef: result.transactionRef,
      qrData: result.qrData,
      gateway: result.gatewayResponse,
    }, "TrueMoney payment initiated — awaiting user confirmation");
  } else {
    await PaymentModel.updateStatus(tx.id, "FAILED", { failureReason: result.failureReason });
    return errorResponse(res, result.failureReason, 402);
  }
});

//  TRUE MONEY WALLET — Step 2: Confirm Payment

router.post("/truemoney/confirm", authenticate, [
  body("transactionId").notEmpty(),
  body("transactionRef").notEmpty(),
], async (req, res) => {
  if (!validate(req, res)) return;

  const { transactionId, transactionRef } = req.body;
  let tx = await PaymentModel.findById(transactionId);
  if (!tx) return errorResponse(res, "Transaction not found", 404);
  if (tx.member_id !== req.user.id) return errorResponse(res, "Forbidden", 403);
  if (tx.status !== "PENDING") return errorResponse(res, `Cannot confirm a ${tx.status} transaction`, 409);

  await PaymentModel.updateToProcessing(tx.id);
  const result = await TrueMoney.confirmTrueMoneyPayment({ transactionRef });

  if (result.success) {
    tx = await PaymentModel.updateStatus(tx.id, "SUCCESS", { referenceId: result.referenceId });
    auditLog({ actorId: req.user.id, actorRole: req.user.role, action: "PAYMENT_SUCCESS",
      entity: "payment_transactions", entityId: tx.id,
      details: { method: "TRUEMONEY", referenceId: result.referenceId }, ip: req.ip });
    return successResponse(res, { transaction: tx, gateway: result.gatewayResponse }, "TrueMoney payment confirmed");
  } else {
    tx = await PaymentModel.updateStatus(tx.id, "FAILED", { failureReason: result.failureReason });
    return errorResponse(res, result.failureReason, 402);
  }
});

//  ADMIN ROUTES

router.get("/", authenticate, requireRole("ADMIN"), [
  query("limit").optional().isInt({ min: 1, max: 200 }),
  query("offset").optional().isInt({ min: 0 }),
  query("status").optional().isIn(["PENDING","PROCESSING","SUCCESS","FAILED","REFUNDED","CANCELLED"]),
  query("paymentMethod").optional().isIn(["CREDIT_CARD","PAYPAL","TRUEMONEY"]),
  query("purpose").optional().isIn(["MEMBERSHIP","COURSE","TRAINING","COURT"]),
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
], async (req, res) => {
  if (!validate(req, res)) return;
  const { limit = 50, offset = 0, status, paymentMethod, purpose, startDate, endDate } = req.query;
  const transactions = await PaymentModel.findAll({
    limit: Number(limit), offset: Number(offset),
    status, paymentMethod, purpose, startDate, endDate,
  });
  return successResponse(res, { transactions, count: transactions.length });
});

router.get("/admin/member/:memberId", authenticate, requireRole("ADMIN"), [
  param("memberId").notEmpty(),
], async (req, res) => {
  if (!validate(req, res)) return;
  const transactions = await PaymentModel.findByMember(req.params.memberId);
  return successResponse(res, { transactions, memberId: req.params.memberId });
});

router.get("/admin/reports/financial", authenticate, requireRole("ADMIN"), [
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
], async (req, res) => {
  if (!validate(req, res)) return;
  const { startDate, endDate } = req.query;
  const summary = await PaymentModel.getFinancialSummary({ startDate, endDate });
  auditLog({ actorId: req.user.id, actorRole: "ADMIN", action: "VIEW_FINANCIAL_REPORT",
    entity: "payment_transactions", details: { startDate, endDate }, ip: req.ip });
  return successResponse(res, { report: summary, generatedAt: new Date().toISOString() });
});

router.post("/admin/refund/:id", authenticate, requireRole("ADMIN"), [
  param("id").notEmpty(),
  body("reason").notEmpty().isLength({ min: 5, max: 500 }),
  body("amount").optional().isFloat({ min: 0.01 }),
], async (req, res) => {
  if (!validate(req, res)) return;

  const tx = await PaymentModel.findById(req.params.id);
  if (!tx) return errorResponse(res, "Transaction not found", 404);
  if (tx.status !== "SUCCESS") return errorResponse(res, "Only successful transactions can be refunded", 409);

  const { reason, amount: refundAmount } = req.body;
  const amount = refundAmount || Number(tx.amount);
  if (amount > Number(tx.amount)) return errorResponse(res, "Refund amount exceeds original transaction amount", 400);

  let refund = await PaymentModel.createRefund({ transactionId: tx.id, adminId: req.user.id, amount, reason });

  let result;
  switch (tx.payment_method) {
    case "CREDIT_CARD":
      result = await CreditCard.refundCreditCardPayment({ referenceId: tx.reference_id, amount });
      break;
    case "PAYPAL":
      result = await PayPal.refundPayPalPayment({ referenceId: tx.reference_id, amount, currency: tx.currency });
      break;
    case "TRUEMONEY":
      result = await TrueMoney.refundTrueMoneyPayment({ referenceId: tx.reference_id, amount });
      break;
    default:
      return errorResponse(res, "Unknown payment method", 500);
  }

  if (result.success) {
    refund = await PaymentModel.updateRefundStatus(refund.id, "SUCCESS", result.referenceId);
    await PaymentModel.updateStatus(tx.id, "REFUNDED");
    auditLog({ actorId: req.user.id, actorRole: "ADMIN", action: "REFUND_ISSUED",
      entity: "payment_refunds", entityId: refund.id,
      details: { transactionId: tx.id, amount, reason, gatewayRef: result.referenceId }, ip: req.ip });
    return successResponse(res, { refund, gateway: result.gatewayResponse }, "Refund processed successfully");
  } else {
    await PaymentModel.updateRefundStatus(refund.id, "FAILED");
    return errorResponse(res, `Refund failed: ${result.failureReason}`, 500);
  }
});

router.post("/admin/cancel/:id", authenticate, requireRole("ADMIN"), [
  param("id").notEmpty(),
  body("reason").notEmpty(),
], async (req, res) => {
  if (!validate(req, res)) return;
  const tx = await PaymentModel.findById(req.params.id);
  if (!tx) return errorResponse(res, "Transaction not found", 404);
  if (!["PENDING"].includes(tx.status)) {
    return errorResponse(res, `Cannot cancel a ${tx.status} transaction`, 409);
  }
  const updated = await PaymentModel.updateStatus(tx.id, "CANCELLED", { failureReason: req.body.reason });
  auditLog({ actorId: req.user.id, actorRole: "ADMIN", action: "CANCEL_TRANSACTION",
    entity: "payment_transactions", entityId: tx.id,
    details: { reason: req.body.reason }, ip: req.ip });
  return successResponse(res, { transaction: updated }, "Transaction cancelled");
});

module.exports = router;
