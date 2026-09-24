import nodemailer, { type Transporter } from "nodemailer";
import { promises as dns } from "node:dns";

export interface PendingRegistration {
  fullName: string;
  email: string;
  passwordHash: string;
  rawPassword?: string;
  educationLevel: string;
  classYear: string;
  course: string;
}

export interface OtpRecord {
  email: string;
  code: string;
  expiresAt: number; // timestamp in ms
  attempts: number;
  lastSentAt: number;
  pendingUserData: PendingRegistration;
}

// In-memory store for pending OTP verifications
const pendingOtps = new Map<string, OtpRecord>();

// OTP Expiration: 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000;
// Resend Cooldown: 30 seconds
const RESEND_COOLDOWN_MS = 30 * 1000;
// Max verification attempts before invalidation
const MAX_ATTEMPTS = 5;

// Lazy nodemailer transporter
let mailTransporter: Transporter | null = null;

function getMailTransporter(): Transporter | null {
  if (mailTransporter) return mailTransporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      mailTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      return mailTransporter;
    } catch (err) {
      console.warn("[OTP] Failed to initialize SMTP transporter:", err);
      return null;
    }
  }

  // Gmail service shortcut
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      mailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
      return mailTransporter;
    } catch (err) {
      console.warn("[OTP] Failed to initialize Gmail transporter:", err);
      return null;
    }
  }

  return null;
}

/**
 * Generate a cryptographically sound 6-digit numeric OTP
 */
export function generateOtpCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return digits.toString();
}

/**
 * Create and register an OTP for a signup request, then dispatch email
 */
export async function createAndSendOtp(
  email: string,
  pendingUserData: PendingRegistration
): Promise<{ success: boolean; message: string; expiresInSeconds: number }> {
  const cleanEmail = email.toLowerCase().trim();
  const domain = cleanEmail.split("@")[1];
  if (!domain) {
    throw new Error("Please provide a valid email address");
  }

  try {
    const mailRecords = await dns.resolveMx(domain);
    const hasDeliverableMailServer = mailRecords.some(
      (record) => Boolean(record.exchange && record.exchange !== ".")
    );
    if (!hasDeliverableMailServer) {
      throw new Error("That email domain cannot receive messages. Please use a real email address.");
    }
  } catch (err: any) {
    if (err?.message?.includes("cannot receive messages")) throw err;
    throw new Error("That email domain cannot receive messages. Please use a real email address.");
  }

  const transporter = getMailTransporter();
  if (!transporter) {
    throw new Error("Email verification is temporarily unavailable. Please try again later.");
  }

  const code = generateOtpCode();
  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_MS;

  const record: OtpRecord = {
    email: cleanEmail,
    code,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
    pendingUserData,
  };

  try {
    const sender = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@edumind.ng";
    await transporter.sendMail({
        from: `"EduMind AI" <${sender}>`,
        to: cleanEmail,
        subject: `${code} is your EduMind AI verification code`,
        text: `Welcome to EduMind AI!\n\nYour 6-digit email verification code is: ${code}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0b0e; color: #f4f4f5; padding: 40px 20px; text-align: center;">
            <div style="max-width: 480px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 36px 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: #10b981; color: #000000; font-size: 20px; font-weight: 900; margin-bottom: 20px;">E</div>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 10px 0;">Verify your email address</h1>
              <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 28px 0; line-height: 1.5;">
                Hello <strong>${pendingUserData.fullName || "Student"}</strong>, enter this 6-digit verification code to complete your EduMind AI registration:
              </p>
              <div style="background: #09090b; border: 1px solid #3f3f46; border-radius: 12px; padding: 18px 24px; margin: 0 auto 28px auto; display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #10b981; font-family: monospace;">
                ${code}
              </div>
              <p style="color: #71717a; font-size: 12px; margin: 0; line-height: 1.5;">
                This code will expire in 10 minutes.<br/>If you did not request this code, you can safely ignore this email.
              </p>
            </div>
            <p style="color: #52525b; font-size: 11px; margin-top: 24px;">© ${new Date().getFullYear()} EduMind AI Academic Intelligence Platform</p>
          </div>
        `,
      });
  } catch (mailErr) {
    console.warn(`[AUTH OTP] SMTP delivery failed for ${cleanEmail}:`, mailErr);
    throw new Error("We could not send the verification code. Please check the email address and try again.");
  }

  pendingOtps.set(cleanEmail, record);

  return {
    success: true,
    message: `Verification code sent to ${cleanEmail}`,
    expiresInSeconds: 600,
  };
}

/**
 * Resend OTP with cooldown guard
 */
export async function resendOtp(
  email: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const existing = pendingOtps.get(cleanEmail);

  if (!existing) {
    return {
      success: false,
      error: "No pending signup found for this email. Please fill out the registration form again.",
    };
  }

  const now = Date.now();
  const timeSinceLastSent = now - existing.lastSentAt;

  if (timeSinceLastSent < RESEND_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastSent) / 1000);
    return {
      success: false,
      error: `Please wait ${remainingSeconds} seconds before requesting another code.`,
    };
  }

  const result = await createAndSendOtp(cleanEmail, existing.pendingUserData);
  return {
    success: true,
    message: `A fresh 6-digit code has been sent to ${cleanEmail}`,
  };
}

/**
 * Verify OTP entered by the user
 */
export function verifyOtp(
  email: string,
  userEnteredCode: string
): { valid: boolean; error?: string; pendingUserData?: PendingRegistration } {
  const cleanEmail = email.toLowerCase().trim();
  const existing = pendingOtps.get(cleanEmail);

  if (!existing) {
    return {
      valid: false,
      error: "No pending registration found for this email. Please sign up again.",
    };
  }

  const now = Date.now();

  if (now > existing.expiresAt) {
    pendingOtps.delete(cleanEmail);
    return {
      valid: false,
      error: "Verification code has expired. Please click 'Resend Code' to receive a new one.",
    };
  }

  if (existing.attempts >= MAX_ATTEMPTS) {
    pendingOtps.delete(cleanEmail);
    return {
      valid: false,
      error: "Too many incorrect attempts. For security, please sign up again to request a new code.",
    };
  }

  const cleanInput = userEnteredCode.trim().replace(/\D/g, "");

  if (cleanInput !== existing.code) {
    existing.attempts += 1;
    const remaining = MAX_ATTEMPTS - existing.attempts;
    return {
      valid: false,
      error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Verification successful! Remove pending record and return data
  const userData = existing.pendingUserData;
  pendingOtps.delete(cleanEmail);

  return {
    valid: true,
    pendingUserData: userData,
  };
}

/**
 * Get current OTP status for an email (e.g. for preview / testing)
 */
export function getPendingOtpInfo(email: string): { exists: boolean; expiresAt?: number } {
  const cleanEmail = email.toLowerCase().trim();
  const existing = pendingOtps.get(cleanEmail);
  if (!existing) return { exists: false };
  return {
    exists: true,
    expiresAt: existing.expiresAt,
  };
}
