import { Router } from "express";

const router = Router();

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
const RUBRIX_API = "https://backend.rubrix.ai/api";

interface SessionData {
  token: string;
  expiresAt: string;
  user: {
    rollNumber: string;
    fullName: string;
    email: string;
  };
}

// In-memory session store (survives the process lifetime)
export const activeSessions = new Map<string, SessionData>();

function normalizeRoll(r: unknown): string {
  return String(r ?? "").trim().toUpperCase();
}

// POST /api/auth/roll/send-otp
router.post("/auth/roll/send-otp", async (req, res) => {
  try {
    const rollNumber = normalizeRoll(req.body?.rollNumber);
    if (!rollNumber) {
      return res.status(400).json({ success: false, error: "Roll number is required." });
    }

    const upstream = await fetch(
      `${RUBRIX_API}/my-account/get-otp?userName=${encodeURIComponent(rollNumber)}`,
      { headers: { Accept: "application/json" } }
    );
    const data = await upstream.json() as any;

    if (data.status === "Success" && data.result === "OK") {
      return res.json({ success: true, message: data.description || "OTP sent to your registered email." });
    } else {
      return res.status(400).json({ success: false, error: data.description || "Roll number not found in Rubrix." });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Network error. Please try again." });
  }
});

// POST /api/auth/roll/verify-otp
router.post("/auth/roll/verify-otp", async (req, res) => {
  try {
    const rollNumber = normalizeRoll(req.body?.rollNumber);
    const otp = String(req.body?.otp ?? "").trim();

    if (!rollNumber || !otp) {
      return res.status(400).json({ success: false, error: "Roll number and OTP are required." });
    }

    const upstream = await fetch(
      `${RUBRIX_API}/my-account/validate-otp?otp=${encodeURIComponent(otp)}&username=${encodeURIComponent(rollNumber)}`,
      { headers: { Accept: "application/json" } }
    );
    const data = await upstream.json() as any;
    const rawAuth = upstream.headers.get("authorization") ?? "";
    const token = rawAuth.startsWith("Bearer ") ? rawAuth.slice(7) : rawAuth;

    if ((data.statusCode === "OK" || upstream.status === 200) && token) {
      // Decode JWT to get identification number
      let identificationNo = rollNumber;
      try {
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
        if (payload.identification_no) identificationNo = payload.identification_no;
      } catch {}

      // Fetch full profile from Rubrix
      let profile: any = {};
      try {
        const infoResp = await fetch(
          `${RUBRIX_API}/my-account/info?identificationNo=${encodeURIComponent(identificationNo)}`,
          { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
        );
        if (infoResp.ok) {
          const infoData = await infoResp.json() as any;
          if (Array.isArray(infoData?.result) && infoData.result.length > 0) {
            profile = infoData.result[0];
          }
        }
      } catch {}

      const firstName = profile.firstName || profile.first_name || "";
      const lastName  = profile.lastName  || profile.last_name  || "";
      const fullName  = [firstName, lastName].filter(Boolean).join(" ") || rollNumber;
      const email     = profile.personalMail || profile.workMail || `${rollNumber.toLowerCase()}@datanauts.in`;

      const user = { rollNumber, fullName, email };
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

      activeSessions.set(token, { token, expiresAt, user });

      return res.json({ success: true, token, expiresAt, user });
    } else {
      return res.status(400).json({ success: false, error: "Incorrect OTP. Please try again." });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// GET /api/auth/roll/me  — validate a session token
router.get("/auth/roll/me", (req, res) => {
  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  const session = activeSessions.get(token);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    activeSessions.delete(token);
    return res.status(401).json({ success: false, error: "Session expired or invalid." });
  }
  return res.json({ success: true, user: session.user, expiresAt: session.expiresAt });
});

export default router;
