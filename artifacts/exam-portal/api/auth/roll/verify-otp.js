const RUBRIX = "https://backend.rubrix.ai/api";

// Simple in-memory sessions (Edge runtime — ephemeral per instance)
const sessions = new Map();

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let body;
  try { body = await req.json(); } catch { 
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), { status: 400 }); 
  }

  const rollNumber = String(body?.rollNumber ?? "").trim().toUpperCase();
  const otp = String(body?.otp ?? "").trim();

  if (!rollNumber || !otp) {
    return new Response(JSON.stringify({ success: false, error: "Roll number and OTP are required." }), { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${RUBRIX}/my-account/validate-otp?otp=${encodeURIComponent(otp)}&username=${encodeURIComponent(rollNumber)}`,
      { headers: { Accept: "application/json" } }
    );
    const data = await upstream.json();
    const rawAuth = upstream.headers.get("authorization") ?? "";
    const token = rawAuth.startsWith("Bearer ") ? rawAuth.slice(7) : rawAuth;

    if ((data.statusCode === "OK" || upstream.status === 200) && token) {
      let identificationNo = rollNumber;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.identification_no) identificationNo = payload.identification_no;
      } catch {}

      let profile = {};
      try {
        const infoResp = await fetch(
          `${RUBRIX}/my-account/info?identificationNo=${encodeURIComponent(identificationNo)}`,
          { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
        );
        if (infoResp.ok) {
          const infoData = await infoResp.json();
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
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      return new Response(
        JSON.stringify({ success: true, token, expiresAt, user }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Incorrect OTP. Please try again." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Something went wrong. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
