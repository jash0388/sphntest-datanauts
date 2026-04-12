import { Router } from "express";
import { db } from "@workspace/db";
import { otpVerificationsTable } from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendOtpEmail } from "../lib/mailer";

const router = Router();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/auth/send-otp", async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email || !email.endsWith("@gmail.com")) {
    res.status(400).json({ error: "A valid @gmail.com address is required." });
    return;
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.delete(otpVerificationsTable).where(eq(otpVerificationsTable.email, email));

  await db.insert(otpVerificationsTable).values({ email, otp, expiresAt });

  const { previewUrl } = await sendOtpEmail(email, otp);

  res.json({
    success: true,
    message: "OTP sent to your email.",
    ...(previewUrl ? { previewUrl } : {}),
  });
});

router.post("/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body as { email?: string; otp?: string };

  if (!email || !otp) {
    res.status(400).json({ error: "Email and OTP are required." });
    return;
  }

  const now = new Date();
  const record = await db.query.otpVerificationsTable.findFirst({
    where: and(
      eq(otpVerificationsTable.email, email),
      eq(otpVerificationsTable.otp, otp),
      eq(otpVerificationsTable.verified, false),
      gt(otpVerificationsTable.expiresAt, now),
    ),
  });

  if (!record) {
    res.status(400).json({ error: "Invalid or expired OTP. Please try again." });
    return;
  }

  await db
    .update(otpVerificationsTable)
    .set({ verified: true })
    .where(eq(otpVerificationsTable.id, record.id));

  res.json({ success: true, message: "Email verified successfully." });
});

export default router;
