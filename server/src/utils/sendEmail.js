import nodemailer from 'nodemailer';
import env from '../config/env.js';

/**
 * Send email using nodemailer with SMTP
 * Used for password reset, email verification, and notifications
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  /**
   * Initialize nodemailer transporter
   */
  initialize() {
    try {
      this.transporter = nodemailer.createTransport({
        host: env.emailHost,
        port: env.emailPort,
        secure: env.emailSecure,
        auth: {
          user: env.emailUser,
          pass: env.emailPass,
        },
      });

      console.log('Email service initialized');
    } catch (error) {
      console.warn('Email service initialization failed:', error.message);
      console.warn('Email sending will be disabled. Please configure EMAIL_USER and EMAIL_PASS in .env');
      this.transporter = null;
    }
  }

  /**
   * Send email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email body (HTML)
   */
  async sendEmail(to, subject, html) {
    if (!this.transporter) {
      console.warn('Email service not available. Email not sent to:', to);
      console.warn('Subject:', subject);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: env.emailFrom,
        to,
        subject,
        html,
      });

      console.log('Email sent to:', to);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send password reset email
   * @param {string} to - User email
   * @param {string} resetToken - Password reset token
   */
  async sendPasswordResetEmail(to, resetToken) {
    const resetUrl = `${env.frontendUrl}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Reset Your Password</h2>
          <p>You requested to reset your password. Click the link below to proceed:</p>
          <p>
            <a href="${resetUrl}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">Site Pulse</p>
        </body>
      </html>
    `;

    await this.sendEmail(to, 'Reset Your Password - Site Pulse', html);
  }

  /**
   * Send email verification email
   * @param {string} to - User email
   * @param {string} verificationToken - Email verification token
   */
  async sendEmailVerification(to, verificationToken) {
    const verificationUrl = `${env.frontendUrl}/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with Site Pulse. Please verify your email address by clicking the link below:</p>
          <p>
            <a href="${verificationUrl}" style="background-color: #16A34A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">Site Pulse</p>
        </body>
      </html>
    `;

    await this.sendEmail(to, 'Verify Your Email - Site Pulse', html);
  }
}

export default new EmailService();