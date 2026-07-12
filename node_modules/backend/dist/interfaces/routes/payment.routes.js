"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = __importDefault(require("../controllers/payment.controller"));
const router = (0, express_1.Router)();
// Stripe routes
router.post('/stripe/intent', payment_controller_1.default.createStripeIntent);
router.post('/stripe/confirm', payment_controller_1.default.confirmStripePayment);
router.post('/stripe-webhook', payment_controller_1.default.handleStripeWebhook);
// VNPay routes
router.post('/vnpay/url', payment_controller_1.default.generateVnPayUrl);
router.get('/vnpay-callback', payment_controller_1.default.handleVnPayCallback);
exports.default = router;
