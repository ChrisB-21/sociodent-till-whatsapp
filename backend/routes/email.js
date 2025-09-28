import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

// Create reusable transporter object using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true' || true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('Mail transporter verification failed:', error);
  } else {
    console.log('Mail transporter is ready');
  }
});

// Send email endpoint
router.post('/send', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"SocioDent Smile" <saitamars1554@gmail.com>',
      replyTo: process.env.SMTP_USER || 'saitamars1554@gmail.com',
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send email' 
    });
  }
});

// Send product order notification to admin
router.post('/send-product-order-email', async (req, res) => {
  try {
    const { adminEmail, orderData } = req.body;
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@sociodent.com',
      to: adminEmail,
      subject: `New Product Order - ${orderData.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">
            New Product Order Received
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p><strong>Order Date:</strong> ${orderData.orderDate}</p>
            <p><strong>Product:</strong> ${orderData.productName}</p>
            <p><strong>Quantity:</strong> ${orderData.quantity}</p>
            <p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
            <p><strong>Payment Method:</strong> ${orderData.paymentMethod.toUpperCase()}</p>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Customer Information</h3>
            <p><strong>Name:</strong> ${orderData.customerName}</p>
            <p><strong>Email:</strong> ${orderData.customerEmail}</p>
            <p><strong>Phone:</strong> ${orderData.customerPhone}</p>
          </div>
          
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Delivery Address</h3>
            <p>${orderData.address.line1}</p>
            ${orderData.address.line2 ? `<p>${orderData.address.line2}</p>` : ''}
            <p>${orderData.address.city}, ${orderData.address.state} - ${orderData.address.pincode}</p>
            ${orderData.address.landmark ? `<p><strong>Landmark:</strong> ${orderData.address.landmark}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">Please process this order and update the status in the admin portal.</p>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated email from SocioDent Order Management System.</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Product order email sent to admin:', adminEmail);
    
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending product order email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send order cancellation notification to admin
router.post('/send-order-cancellation-email', async (req, res) => {
  try {
    const { adminEmail, orderData } = req.body;
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@sociodent.com',
      to: adminEmail,
      subject: `Order Cancelled - ${orderData.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626; border-bottom: 2px solid #DC2626; padding-bottom: 10px;">
            Order Cancellation Notice
          </h2>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <h3 style="color: #333; margin-top: 0;">Cancelled Order Details</h3>
            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p><strong>Original Order Date:</strong> ${orderData.orderDate}</p>
            <p><strong>Product:</strong> ${orderData.productName}</p>
            <p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
            <p><strong>Payment Method:</strong> ${orderData.paymentMethod.toUpperCase()}</p>
            <p><strong>Cancellation Reason:</strong> ${orderData.cancellationReason}</p>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Customer Information</h3>
            <p><strong>Name:</strong> ${orderData.customerName}</p>
            <p><strong>Email:</strong> ${orderData.customerEmail}</p>
            <p><strong>Phone:</strong> ${orderData.customerPhone}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">
              ${orderData.paymentMethod === 'online' ? 
                'Please process refund if payment was already collected.' : 
                'No refund required as it was a COD order.'
              }
            </p>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated email from SocioDent Order Management System.</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Order cancellation email sent to admin:', adminEmail);
    
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending order cancellation email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
