const RUBRIX = "https://backend.rubrix.ai/api";

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), { status: 400 });
  }

  const rollNumber = String(body?.rollNumber ?? "").trim().toUpperCase();
  if (!rollNumber) {
    return new Response(JSON.stringify({ success: false, error: "Roll number is required." }), { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${RUBRIX}/my-account/get-otp?userName=${encodeURIComponent(rollNumber)}`,
      { headers: { Accept: "application/json" } }
    );
    const data = await upstream.json();

    if (data.status === "Success" && data.result === "OK") {
      return new Response(
        JSON.stringify({ success: true, message: data.description || "OTP sent to your registered email." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: data.description || "Roll number not found in Rubrix." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Network error. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
