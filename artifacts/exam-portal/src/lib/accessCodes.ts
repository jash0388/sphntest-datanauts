import { supabase } from "./supabase";

export interface AccessCode {
  id: string;
  code: string;
  is_used: boolean;
  used_by_roll?: string | null;
  used_by_name?: string | null;
  used_at?: string | null;
  created_at: string;
}

const LOCAL_STORAGE_KEY = "sphn_access_codes";

function getLocalCodes(): AccessCode[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalCodes(codes: AccessCode[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(codes));
  } catch {}
}

export async function fetchAllAccessCodes(): Promise<AccessCode[]> {
  try {
    const { data, error } = await supabase.from("access_codes").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      return data as AccessCode[];
    }
  } catch {}
  return getLocalCodes();
}

export async function generateNewAccessCode(customCode?: string): Promise<AccessCode> {
  const codeStr = customCode?.trim().toUpperCase() || `OTC-${Math.floor(100000 + Math.random() * 900000)}`;
  const newObj: AccessCode = {
    id: `code_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code: codeStr,
    is_used: false,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from("access_codes").insert([newObj]).select().single();
    if (!error && data) return data as AccessCode;
  } catch {}

  // Save to profiles as backup
  try {
    await supabase.from("profiles").upsert({
      id: `otc_code_${codeStr}`,
      full_name: "ONE_TIME_CODE",
      email: codeStr,
      role: "AVAILABLE",
      college: "",
      name: "",
    }, { onConflict: "id" });
  } catch {}

  const local = getLocalCodes();
  const updated = [newObj, ...local.filter(c => c.code !== codeStr)];
  saveLocalCodes(updated);
  return newObj;
}

export async function validateAccessCode(code: string): Promise<{ valid: boolean; message?: string }> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return { valid: false, message: "Please enter a valid one-time code." };

  // 1. Check access_codes table in Supabase
  try {
    const { data, error } = await supabase
      .from("access_codes")
      .select("*")
      .eq("code", cleanCode)
      .maybeSingle();

    if (!error && data) {
      if (data.is_used) {
        return { valid: false, message: `This code was already used by ${data.used_by_roll || "another student"}.` };
      }
      return { valid: true };
    }
  } catch {}

  // 2. Check profiles table in Supabase (cross-domain synced backup)
  try {
    const { data: profData, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", `otc_code_${cleanCode}`)
      .maybeSingle();

    if (!profErr && profData) {
      if (profData.role === "USED") {
        return { valid: false, message: `This code was already used by ${profData.college || "another student"}.` };
      }
      return { valid: true };
    }
  } catch {}

  // 3. Check local storage
  const local = getLocalCodes();
  const found = local.find((c) => c.code.toUpperCase() === cleanCode);
  if (found) {
    if (found.is_used) {
      return { valid: false, message: `This code was already used by ${found.used_by_roll || "another student"}.` };
    }
    return { valid: true };
  }

  // REJECT ALL UNRECOGNIZED CODES - Strictly require code to be created by Admin
  return { valid: false, message: "Invalid one-time code. Please check with your invigilator." };
}

export async function markAccessCodeUsed(code: string, rollNumber: string, studentName: string): Promise<boolean> {
  const cleanCode = code.trim().toUpperCase();
  const updateData = {
    is_used: true,
    used_by_roll: rollNumber.toUpperCase(),
    used_by_name: studentName,
    used_at: new Date().toISOString(),
  };

  // 1. Update access_codes table
  try {
    await supabase.from("access_codes").update(updateData).eq("code", cleanCode);
  } catch {}

  // 2. Update profiles table
  try {
    await supabase.from("profiles").upsert({
      id: `otc_code_${cleanCode}`,
      full_name: "ONE_TIME_CODE",
      email: cleanCode,
      role: "USED",
      college: rollNumber.toUpperCase(),
      name: studentName,
    }, { onConflict: "id" });
  } catch {}

  // 3. Update localStorage
  const local = getLocalCodes();
  const idx = local.findIndex((c) => c.code.toUpperCase() === cleanCode);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updateData };
    saveLocalCodes(local);
  }
  return true;
}
