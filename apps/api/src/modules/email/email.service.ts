import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromAddress: string;
  private readonly backendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';

    if (!apiKey) {
      if (isDev) {
        this.logger.warn(
          'RESEND_API_KEY is not set. ' +
          'Emails will not be sent in development. ' +
          'Set your Resend API key in .env to enable email sending.',
        );
      } else {
        throw new InternalServerErrorException(
          'RESEND_API_KEY environment variable is not set.',
        );
      }
    }

    this.resend = new Resend(apiKey ?? 're_dev_noop');
    this.fromAddress =
      this.configService.get<string>('EMAIL_FROM') ?? 'LXUY <noreply@lxuy.com>';
    this.backendUrl =
      this.configService.get<string>('BACKEND_URL') ?? 'http://localhost:3001';
  }

  /**
   * Sends the email-verification link to the user.
   * The raw token is embedded in the link; only its SHA-256 hash is stored in DB.
   */
  async sendVerificationEmail(
    to: string,
    firstName: string,
    rawToken: string,
  ): Promise<void> {
    const verifyUrl = this.backendUrl + '/api/v1/auth/verify-email?token=' + rawToken;
    const year = new Date().getFullYear();

    const body = [
      '<!DOCTYPE html>',
      '<html lang="en"><head><meta charset="UTF-8" />',
      '<title>Verify your LXUY email</title></head>',
      '<body style="margin:0;padding:0;background:#f9f6f0;font-family:Georgia,serif;">',
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f0;padding:48px 0;">',
      '<tr><td align="center">',
      '<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8e1d4;">',
      '<tr><td style="background:#1a1a1a;padding:32px 48px;text-align:center;">',
      '<p style="margin:0;font-size:22px;letter-spacing:0.4em;color:#c9a96e;text-transform:uppercase;">LXUY</p>',
      '<p style="margin:6px 0 0;font-size:10px;letter-spacing:0.25em;color:#888;text-transform:uppercase;"></p>',
      '</td></tr>',
      '<tr><td style="padding:48px;">',
      '<p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;color:#c9a96e;text-transform:uppercase;">Welcome</p>',
      '<h1 style="margin:0 0 24px;font-size:28px;font-weight:400;color:#1a1a1a;">Dear ' + firstName + ',</h1>',
      '<p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.8;">',
      'Thank you for joining LXUY. To complete your registration, please verify your email address.</p>',
      '<table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">',
      '<tr><td style="background:#1a1a1a;padding:14px 36px;text-align:center;">',
      '<a href="' + verifyUrl + '" style="color:#c9a96e;font-size:11px;letter-spacing:0.25em;text-decoration:none;text-transform:uppercase;font-weight:600;">Verify Email Address</a>',
      '</td></tr></table>',
      '<p style="margin:0 0 8px;font-size:12px;color:#888;">This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.</p>',
      '<p style="margin:24px 0 0;font-size:11px;color:#bbb;word-break:break-all;">' + verifyUrl + '</p>',
      '</td></tr>',
      '<tr><td style="padding:24px 48px;border-top:1px solid #e8e1d4;text-align:center;">',
      '<p style="margin:0;font-size:11px;color:#bbb;">&copy; ' + year + ' LXUY . All rights reserved.</p>',
      '</td></tr>',
      '</table></td></tr></table></body></html>',
    ].join('\n');

    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: 'Verify your LXUY email address',
        html: body,
      });
      this.logger.log('Verification email sent to ' + to);
    } catch (err) {
      this.logger.error('Failed to send verification email to ' + to, err);
      throw err;
    }
  }

  /**
   * Sends the password reset link to the user.
   * The link targets the backend redirect handler for Option A security.
   */
  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    rawToken: string,
  ): Promise<void> {
    const resetUrl = this.backendUrl + '/api/v1/auth/reset-password?token=' + rawToken;
    const year = new Date().getFullYear();

    const body = [
      '<!DOCTYPE html>',
      '<html lang="en"><head><meta charset="UTF-8" />',
      '<title>Reset your LXUY password</title></head>',
      '<body style="margin:0;padding:0;background:#f9f6f0;font-family:Georgia,serif;">',
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f0;padding:48px 0;">',
      '<tr><td align="center">',
      '<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8e1d4;">',
      '<tr><td style="background:#1a1a1a;padding:32px 48px;text-align:center;">',
      '<p style="margin:0;font-size:22px;letter-spacing:0.4em;color:#c9a96e;text-transform:uppercase;">LXUY</p>',
      '<p style="margin:6px 0 0;font-size:10px;letter-spacing:0.25em;color:#888;text-transform:uppercase;"></p>',
      '</td></tr>',
      '<tr><td style="padding:48px;">',
      '<p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;color:#c9a96e;text-transform:uppercase;">Security</p>',
      '<h1 style="margin:0 0 24px;font-size:28px;font-weight:400;color:#1a1a1a;">Dear ' + firstName + ',</h1>',
      '<p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.8;">',
      'We received a request to reset the password for your LXUY account. To reset your password, please click the button below.</p>',
      '<table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">',
      '<tr><td style="background:#1a1a1a;padding:14px 36px;text-align:center;">',
      '<a href="' + resetUrl + '" style="color:#c9a96e;font-size:11px;letter-spacing:0.25em;text-decoration:none;text-transform:uppercase;font-weight:600;">Reset Password</a>',
      '</td></tr></table>',
      '<p style="margin:0 0 8px;font-size:12px;color:#888;">This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>',
      '<p style="margin:24px 0 0;font-size:11px;color:#bbb;word-break:break-all;">' + resetUrl + '</p>',
      '</td></tr>',
      '<tr><td style="padding:24px 48px;border-top:1px solid #e8e1d4;text-align:center;">',
      '<p style="margin:0;font-size:11px;color:#bbb;">&copy; ' + year + ' LXUY. All rights reserved.</p>',
      '</td></tr>',
      '</table></td></tr></table></body></html>',
    ].join('\n');

    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: 'Reset your LXUY password',
        html: body,
      });
      this.logger.log('Password reset email sent to ' + to);
    } catch (err) {
      this.logger.error('Failed to send password reset email to ' + to, err);
      throw err;
    }
  }
}
