const Redis = require('ioredis');
const config = require('../config');

const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

const PAYMENT_STATUS_PREFIX = 'payment:status:';
const PAYMENT_DETAILS_PREFIX = 'payment:details:';
const STATUS_EXPIRY = 7200; // 2 hours in seconds

class PaymentCache {
    static async setPaymentStatus(paymentId, status) {
        await redis.setex(
            `${PAYMENT_STATUS_PREFIX}${paymentId}`,
            STATUS_EXPIRY,
            status
        );
    }

    static async getPaymentStatus(paymentId) {
        return await redis.get(`${PAYMENT_STATUS_PREFIX}${paymentId}`);
    }

    static async setPaymentDetails(paymentId, details) {
        await redis.setex(
            `${PAYMENT_DETAILS_PREFIX}${paymentId}`,
            STATUS_EXPIRY,
            JSON.stringify(details)
        );
    }

    static async getPaymentDetails(paymentId) {
        const details = await redis.get(`${PAYMENT_DETAILS_PREFIX}${paymentId}`);
        return details ? JSON.parse(details) : null;
    }

    static async clearPaymentCache(paymentId) {
        await redis.del(
            `${PAYMENT_STATUS_PREFIX}${paymentId}`,
            `${PAYMENT_DETAILS_PREFIX}${paymentId}`
        );
    }
}

module.exports = PaymentCache;