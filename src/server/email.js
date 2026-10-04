import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

export async function sendInstructorLoginEmail({ toEmail, instructorName, temporaryPassword }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || `"Java OOP Examination Portal" <${smtpUser || 'no-reply@uettaxila.edu.pk'}>`;

  const subject = "Java OOP Examination Portal — Instructor Login";
  const textBody = `Dear Instructor,

Your temporary login password is:

${temporaryPassword}

This password expires in 10 minutes and can only be used once.

If you did not request this login, please ignore this email.`;

  const htmlBody = `
  <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 30px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #38bdf8; margin: 0; font-family: monospace; letter-spacing: 1px;">JAVA OOP ASSESSMENT</h2>
      <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0;">Instructor Security Gateway</p>
    </div>
    <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; border: 1px solid #334155;">
      <p style="margin-top: 0; font-size: 14px; color: #e2e8f0;">Dear Instructor,</p>
      <p style="font-size: 13px; color: #94a3b8;">Your temporary login password is:</p>
      <div style="text-align: center; padding: 15px; background: #020617; border: 1px solid #0284c7; border-radius: 6px; font-size: 24px; font-weight: bold; font-family: monospace; color: #38bdf8; letter-spacing: 4px; margin: 15px 0;">
        ${temporaryPassword}
      </div>
      <p style="font-size: 12px; color: #fbbf24; margin-bottom: 0;">This password expires in <strong>10 minutes</strong> and can only be used <strong>once</strong>.</p>
    </div>
    <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 20px;">
      If you did not request this login, please ignore this email.
    </p>
  </div>
  `;

  // Always log to data/email-outbox.log and console for audit / local testing
  try {
    const emailLogPath = path.resolve(process.cwd(), 'data/email-outbox.log');
    const logDir = path.dirname(emailLogPath);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const emailLogEntry = `
================================================================================
INSTITUTIONAL EMAIL DISPATCH: Java OOP Examination Portal
Timestamp : ${new Date().toISOString()}
To        : ${instructorName || 'Instructor'} <${toEmail}>
Subject   : ${subject}
--------------------------------------------------------------------------------
${textBody}
================================================================================
`;
    fs.appendFileSync(emailLogPath, emailLogEntry, 'utf-8');
    console.log(emailLogEntry);
  } catch (logErr) {
    console.error('Failed writing to email outbox log:', logErr);
  }

  // If SMTP configuration is provided, send real email
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject,
        text: textBody,
        html: htmlBody
      });
      console.log(`[SMTP] Email successfully dispatched to ${toEmail}`);
    } catch (smtpErr) {
      console.error(`[SMTP ERROR] Failed sending email to ${toEmail}:`, smtpErr.message);
    }
  }
}
