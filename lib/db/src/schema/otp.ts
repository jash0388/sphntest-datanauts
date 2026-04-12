import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const otpVerificationsTable = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OtpVerification = typeof otpVerificationsTable.$inferSelect;
