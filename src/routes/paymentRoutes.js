const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

// Webhook signature verification middleware
const verifyWebhookSignature = (req, res, next) => {
    const signature = req.headers['stripe-signature'];
    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        req.stripeEvent = event;
        next();
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send('Invalid webhook signature');
    }
};

// Initialize payment
router.post('/payment/init', async (req, res) => {
    try {
        const paymentData = req.body;
        const result = await paymentService.initiatePayment(paymentData);
        res.json(result);
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({
            error: 'Failed to initiate payment'
        });
    }
});

// Payment status endpoint
router.get('/payment/:paymentId/status', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const status = await paymentService.getPaymentStatus(paymentId);
        res.json(status);
    } catch (error) {
        console.error('Payment status error:', error);
        res.status(404).json({
            error: 'Payment not found'
        });
    }
});

// Webhook endpoint
router.post('/payment/webhook', 
    express.raw({type: 'application/json'}),
    verifyWebhookSignature,
    async (req, res) => {
        try {
            const event = req.stripeEvent;
            
            // Handle only payment-related events
            if (event.type.startsWith('payment_intent.')) {
                await paymentService.handleWebhook(event);
            }

            res.json({ received: true });
        } catch (error) {
            console.error('Webhook processing error:', error);
            res.status(500).json({
                error: 'Failed to process webhook'
            });
        }
    }
);

module.exports = router;