const Bull = require('bull');
const PaymentCache = require('../config/paymentCache');
const Payment = require('../models/Payment');
const config = require('../config');

const emailQueue = new Bull('email-queue', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
    }
});

class PaymentService {
    constructor() {
        this.paymentGateway = config.paymentGateway; // Your payment gateway instance
    }

    async initiatePayment(data) {
        try {
            // Create payment record with pending status
            const payment = await Payment.create({
                ...data,
                status: 'PENDING',
                createdAt: new Date()
            });

            // Cache the initial payment status
            await PaymentCache.setPaymentStatus(payment._id, 'PENDING');
            await PaymentCache.setPaymentDetails(payment._id, {
                amount: data.amount,
                currency: data.currency,
                customerId: data.customerId
            });

            // Initiate payment with payment gateway
            const paymentIntent = await this.paymentGateway.createPaymentIntent({
                amount: data.amount,
                currency: data.currency,
                metadata: {
                    paymentId: payment._id.toString()
                }
            });

            return {
                paymentId: payment._id,
                clientSecret: paymentIntent.client_secret,
                status: 'PENDING'
            };
        } catch (error) {
            console.error('Payment initiation error:', error);
            throw new Error('Failed to initiate payment');
        }
    }

    async handleWebhook(event) {
        const { paymentId } = event.metadata;
        const status = this.mapPaymentStatus(event.type);

        try {
            // Update cache immediately
            await PaymentCache.setPaymentStatus(paymentId, status);

            // Update database
            await Payment.findByIdAndUpdate(paymentId, {
                status,
                updatedAt: new Date(),
                paymentDetails: event
            });

            if (status === 'SUCCESS') {
                // Queue email/invoice sending
                await this.queuePostPaymentTasks(paymentId);
            }

            return true;
        } catch (error) {
            console.error('Webhook handling error:', error);
            throw error;
        }
    }

    async getPaymentStatus(paymentId) {
        try {
            // Try cache first
            const cachedStatus = await PaymentCache.getPaymentStatus(paymentId);
            if (cachedStatus) {
                return {
                    status: cachedStatus,
                    details: await PaymentCache.getPaymentDetails(paymentId)
                };
            }

            // Fallback to database
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            // Update cache
            await PaymentCache.setPaymentStatus(paymentId, payment.status);
            await PaymentCache.setPaymentDetails(paymentId, payment.paymentDetails);

            return {
                status: payment.status,
                details: payment.paymentDetails
            };
        } catch (error) {
            console.error('Error fetching payment status:', error);
            throw error;
        }
    }

    async queuePostPaymentTasks(paymentId) {
        const payment = await Payment.findById(paymentId);
        
        // Queue invoice generation and email sending
        await emailQueue.add('send-invoice', {
            paymentId,
            email: payment.customerEmail,
            amount: payment.amount,
            invoiceData: payment.paymentDetails
        });

        // Queue receipt email
        await emailQueue.add('send-receipt', {
            paymentId,
            email: payment.customerEmail,
            amount: payment.amount
        });
    }

    mapPaymentStatus(eventType) {
        const statusMap = {
            'payment_intent.succeeded': 'SUCCESS',
            'payment_intent.failed': 'FAILED',
            'payment_intent.canceled': 'CANCELLED'
        };
        return statusMap[eventType] || 'PENDING';
    }
}

module.exports = new PaymentService();