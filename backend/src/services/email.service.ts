import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

/**
 * Email Service
 * Sends OTP verification emails via SMTP (Nodemailer).
 * Falls back to console logging in development if SMTP is not configured.
 */
export class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private readonly isConfigured: boolean;

    constructor() {
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        this.isConfigured = !!(smtpHost && smtpUser && smtpPass);

        if (this.isConfigured) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
            logger.info('✓ Email service configured with SMTP');
        } else {
            logger.info('⚠ SMTP not configured — OTPs will be logged to console (development mode)');
        }
    }

    /**
     * Send OTP verification email
     */
    async sendOtpEmail(to: string, otpCode: string): Promise<boolean> {
        const subject = 'PharmaLync Verification Code';

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
        💊 PharmaLync
      </h1>
      <p style="color: #ccfbf1; margin: 8px 0 0; font-size: 14px;">Secure Healthcare Platform</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <p style="color: #334155; font-size: 16px; margin: 0 0 8px;">Hello,</p>
      <p style="color: #64748b; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
        Use the verification code below to sign in to your PharmaLync account.
      </p>

      <!-- OTP Code -->
      <div style="background: #f0fdfa; border: 2px dashed #14b8a6; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; font-weight: 600;">
          Verification Code
        </p>
        <p style="color: #0f766e; font-size: 36px; font-weight: 800; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
          ${otpCode}
        </p>
      </div>

      <!-- Expiry Warning -->
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 0 0 24px;">
        <p style="color: #92400e; font-size: 13px; margin: 0; font-weight: 500;">
          ⏱ This code will expire in <strong>5 minutes</strong>.
        </p>
      </div>

      <!-- Security Notice -->
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
        🔒 Do not share this code with anyone. PharmaLync will never ask for your verification code via phone or message.
        If you did not request this login, please ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
        &copy; ${new Date().getFullYear()} PharmaLync. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

        const textBody = `PharmaLync Verification Code

Your verification code is: ${otpCode}

This code will expire in 5 minutes.

Do not share this code with anyone. If you did not request this login, please ignore this email.`;

        // If SMTP is not configured, log to console
        if (!this.isConfigured || !this.transporter) {
            console.log('\n' + '='.repeat(60));
            console.log('📧 EMAIL OTP (Development Mode — SMTP not configured)');
            console.log('='.repeat(60));
            console.log(`  To:   ${to}`);
            console.log(`  Code: ${otpCode}`);
            console.log(`  Exp:  5 minutes`);
            console.log('='.repeat(60) + '\n');
            return true;
        }

        try {
            const fromAddress = process.env.SMTP_FROM || `"PharmaLync" <${process.env.SMTP_USER}>`;

            await this.transporter.sendMail({
                from: fromAddress,
                to,
                subject,
                text: textBody,
                html: htmlBody,
            });

            logger.info('OTP email sent successfully', { to });
            return true;
        } catch (error: any) {
            logger.error('Failed to send OTP email', { to, error: error.message });
            return false;
        }
    }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
    if (!emailServiceInstance) {
        emailServiceInstance = new EmailService();
    }
    return emailServiceInstance;
}
