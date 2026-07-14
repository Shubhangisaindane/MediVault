import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;

const smtpConfigured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASSWORD);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    })
  : null;

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const subject = 'Reset your MediVault password';
  const text = `We received a request to reset your MediVault password.\n\nReset it here (link expires in 1 hour):\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color:#059669; margin-bottom: 8px;">Reset your MediVault password</h2>
      <p style="color:#334155; line-height: 1.6;">We received a request to reset your password. This link expires in 1 hour.</p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}" style="display:inline-block;background:#059669;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">
          Reset Password
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    </div>
  `;

  if (!transporter) {
    // A reset link must never be exposed outside the recipient's mailbox.
    throw new Error('Password reset email is not configured.');
  }

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}
