import nodemailer from "nodemailer";
import { logger } from "./logger";

let transporter: nodemailer.Transporter | null = null;
let testAccountEmail = "";

async function getTransporter() {
  if (transporter) return transporter;

  const smtpEmail = process.env["SMTP_EMAIL"];
  const smtpPassword = process.env["SMTP_APP_PASSWORD"];

  if (smtpEmail && smtpPassword) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: smtpEmail, pass: smtpPassword },
    });
    testAccountEmail = smtpEmail;
    logger.info("Mailer: using Gmail SMTP");
  } else {
    const testAccount = await nodemailer.createTestAccount();
    testAccountEmail = testAccount.user;
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    logger.info({ user: testAccount.user }, "Mailer: using Ethereal test account (no real emails sent)");
  }

  return transporter;
}

export async function sendOtpEmail(toEmail: string, otp: string) {
  const t = await getTransporter();

  const info = await t.sendMail({
    from: `"ExamPortal" <${testAccountEmail}>`,
    to: toEmail,
    subject: "Your ExamPortal Verification Code",
    text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f0f;color:#e5e5e5;border-radius:12px;border:1px solid #222">
        <div style="text-align:center;margin-bottom:24px">
          <div style="display:inline-block;width:48px;height:48px;background:#4f46e5;border-radius:50%;line-height:48px;font-size:24px">&#128274;</div>
          <h2 style="margin:12px 0 4px;color:#fff;font-size:20px">ExamPortal</h2>
          <p style="margin:0;color:#888;font-size:13px">Secure Academic Assessment</p>
        </div>
        <p style="color:#aaa;font-size:14px;margin-bottom:8px">Your verification code is:</p>
        <div style="background:#1a1a2e;border:1px solid #4f46e5;border-radius:8px;padding:20px;text-align:center;margin:16px 0">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#818cf8;font-family:monospace">${otp}</span>
        </div>
        <p style="color:#888;font-size:13px;text-align:center">Expires in <strong style="color:#e5e5e5">10 minutes</strong></p>
        <hr style="border:none;border-top:1px solid #222;margin:24px 0"/>
        <p style="color:#555;font-size:12px;text-align:center">If you did not request this code, you can safely ignore this email.</p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    logger.info({ previewUrl, to: toEmail }, "OTP email preview (Ethereal — open this URL to see the email)");
  }

  return { previewUrl };
}
