const Bull = require('bull');
const config = require('../config');
const emailService = require('./emailService');
const invoiceService = require('./invoiceService');

const emailQueue = new Bull('email-queue', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
    }
});

// Process invoice emails
emailQueue.process('send-invoice', async (job) => {
    const { paymentId, email, amount, invoiceData } = job.data;
    
    try {
        // Generate invoice PDF
        const invoice = await invoiceService.generateInvoice({
            paymentId,
            amount,
            ...invoiceData
        });

        // Send invoice email
        await emailService.sendInvoiceEmail(email, {
            invoice,
            amount,
            paymentId
        });

        return { success: true, paymentId };
    } catch (error) {
        console.error('Invoice email processing error:', error);
        throw error;
    }
});

// Process receipt emails
emailQueue.process('send-receipt', async (job) => {
    const { paymentId, email, amount } = job.data;
    
    try {
        await emailService.sendReceiptEmail(email, {
            paymentId,
            amount,
            date: new Date()
        });

        return { success: true, paymentId };
    } catch (error) {
        console.error('Receipt email processing error:', error);
        throw error;
    }
});

// Handle failed jobs
emailQueue.on('failed', (job, error) => {
    console.error('Queue job failed:', {
        jobId: job.id,
        type: job.name,
        error: error.message
    });
});

// Optional: Add retry logic for failed jobs
emailQueue.on('failed', async (job) => {
    if (job.attemptsMade < 3) {
        await job.retry();
    }
});

module.exports = emailQueue;