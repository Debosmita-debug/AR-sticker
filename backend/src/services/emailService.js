import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send verification email
 * @param {string} email - User email
 * @param {string} verificationToken - Token for email verification
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Verify Your Email - AR Sticker Platform',
      html: `
        <h2>Welcome to AR Sticker Platform!</h2>
        <p>Click the link below to verify your email address:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>Or copy this link: ${verifyUrl}</p>
        <p>This link expires in 24 hours.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending verification email: ${error.message}`);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetToken - Token for password reset
 * @returns {Promise<void>}
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Password Reset - AR Sticker Platform',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link expires in 1 hour.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending password reset email: ${error.message}`);
    throw error;
  }
};

/**
 * Send sticker created notification
 * @param {string} email - User email
 * @param {string} stickerName - Sticker name/caption
 * @param {string} arPageUrl - AR viewer page URL
 * @returns {Promise<void>}
 */
export const sendStickerNotification = async (email, stickerName, arPageUrl) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Your AR Sticker is Ready!',
      html: `
        <h2>Your AR Sticker Created Successfully</h2>
        <p>Your sticker "${stickerName || 'Untitled'}" is now ready to view!</p>
        <a href="${arPageUrl}" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;">
          View AR Sticker
        </a>
        <p>Share the link above with others to view your creation.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    logger.info(`Sticker notification sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending sticker notification: ${error.message}`);
    throw error;
  }
};

/**
 * Send sticker expiration warning
 * @param {string} email - User email
 * @param {string} stickerName - Sticker name
 * @param {number} hoursUntilExpiry - Hours until expiry
 * @returns {Promise<void>}
 */
export const sendExpirationWarning = async (email, stickerName, hoursUntilExpiry) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Your AR Sticker Expires Soon',
      html: `
        <h2>Sticker Expiration Warning</h2>
        <p>Your sticker "${stickerName || 'Untitled'}" will expire in ${hoursUntilExpiry} hours.</p>
        <p>Log in to your dashboard to extend the expiration date or create a new sticker.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    logger.info(`Expiration warning sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending expiration warning: ${error.message}`);
    throw error;
  }
};

/**
 * Test email configuration
 * @returns {Promise<boolean>} - True if configuration is valid
 */
export const testEmailConfig = async () => {
  try {
    await transporter.verify();
    logger.info('Email configuration verified');
    return true;
  } catch (error) {
    logger.error(`Email configuration error: ${error.message}`);
    throw error;
  }
};
