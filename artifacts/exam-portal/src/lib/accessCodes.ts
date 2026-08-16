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

// Fallback initial codes stored in localStorage if Supabase table is absent
const LOCAL_STORAGE_KEY = "sphn_access_codes";

const DEFAULT_CODES: AccessCode[] = [
  { id: "1", code: "SPHN2026", is_used: false, created_at: new Date().toISOString() },
  { id: "2", code: "DATANAUTS100", is_used: false, created_at: new Date().toISOString() },
  { id: "3", code: "EXAM2026", is_used: false, created_at: new Date().toISOString() },
  { id: "4", code: "OTC-749201", is_used: false, created_at: new Date().toISOString() },
  { id: "5", code: "OTC-881923", is_used: false, created_at: new Date().toISOString() },
];

function getLocalCodes(): AccessCode[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_CODES));
      return DEFAULT_CODES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CODES;
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

  const local = getLocalCodes();
  const updated = [newObj, ...local];
  saveLocalCodes(updated);
  return newObj;
}

export async function validateAccessCode(code: string): Promise<{ valid: boolean; message?: string }> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return { valid: false, message: "Please enter a valid one-time code." };

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

  // Fallback to local codes
  const local = getLocalCodes();
  const found = local.find((c) => c.code.toUpperCase() === cleanCode);
  if (!found) {
    return { valid: false, message: "Invalid one-time code. Please check with your invigilator." };
  }
  if (found.is_used) {
    return { valid: false, message: `This code was already used by ${found.used_by_roll || "another student"}.` };
  }
  return { valid: true };
}

export async function markAccessCodeUsed(code: string, rollNumber: string, studentName: string): Promise<boolean> {
  const cleanCode = code.trim().toUpperCase();
  const updateData = {
    is_used: true,
    used_by_roll: rollNumber.toUpperCase(),
    used_by_name: studentName,
    used_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from("access_codes")
      .update(updateData)
      .eq("code", cleanCode);
    if (!error) return true;
  } catch {}

  const local = getLocalCodes();
  const idx = local.findIndex((c) => c.code.toUpperCase() === cleanCode);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updateData };
    saveLocalCodes(local);
  }
  return true;
}
