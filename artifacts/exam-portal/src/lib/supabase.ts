import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseExam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  max_violations: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseQuestion {
  id: string;
  exam_id: string;
  question: string;
  question_type: "mcq" | "paragraph" | "code";
  options: string[] | null;
  correct_answer: string | null;
  marks: number;
  sort_order: number;
  created_at: string;
}

export interface SupabaseSubmission {
  id: string;
  user_id: string;
  exam_id: string;
  score: number;
  total_marks: number;
  violations: number;
  time_used_seconds: number;
  status: "completed" | "terminated" | "pending";
  student_name: string;
  roll_number: string;
  submitted_at: string;
}

export interface StudentProfile {
  id: string;
  email: string;
  display_name: string | null;
  college: string;
  department: string;
  roll_number: string;
  created_at: string;
}
