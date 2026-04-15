import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SupabaseExam, type SupabaseQuestion, type SupabaseSubmission } from "@/lib/supabase";

export function useAvailableExams() {
  return useQuery({
    queryKey: ["exams", "available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupabaseExam[];
    },
  });
}

export function useExam(examId: string | undefined) {
  return useQuery({
    queryKey: ["exam", examId],
    enabled: !!examId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();
      if (error) throw error;
      return data as SupabaseExam;
    },
  });
}

export function useExamQuestions(examId: string | undefined) {
  return useQuery({
    queryKey: ["exam_questions", examId],
    enabled: !!examId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_questions")
        .select("*")
        .eq("exam_id", examId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupabaseQuestion[];
    },
  });
}

export function useMySubmissions(userId: string | undefined) {
  return useQuery({
    queryKey: ["submissions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_submissions")
        .select("*, exams(title)")
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (SupabaseSubmission & { exams: { title: string } | null })[];
    },
  });
}

export function useSubmission(submissionId: string | undefined) {
  return useQuery({
    queryKey: ["submission", submissionId],
    enabled: !!submissionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_submissions")
        .select("*, exams(title)")
        .eq("id", submissionId!)
        .single();
      if (error) throw error;
      return data as SupabaseSubmission & { exams: { title: string } | null };
    },
  });
}

export function useHasSubmitted(userId: string | undefined, examId: string | undefined) {
  return useQuery({
    queryKey: ["has_submitted", userId, examId],
    enabled: !!userId && !!examId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_submissions")
        .select("id")
        .eq("user_id", userId!)
        .eq("exam_id", examId!)
        .maybeSingle();
      if (error) throw error;
      return data !== null;
    },
  });
}

export function useSubmitExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      user_id: string;
      exam_id: string;
      score: number;
      total_marks: number;
      violations: number;
      time_used_seconds: number;
      status: "completed" | "terminated";
      student_name: string;
      roll_number: string;
      student_answers?: Record<string, any>;
      question_snapshots?: any[];
    }) => {
      const { data, error } = await supabase
        .from("exam_submissions")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as SupabaseSubmission;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["submissions", data.user_id] });
    },
  });
}

export function useMyStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["stats", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_submissions")
        .select("score, total_marks, violations, status")
        .eq("user_id", userId);
      if (error) throw error;
      const rows = data ?? [];
      const completed = rows.filter((r) => r.status === "completed");
      const totalAttempts = rows.length;
      const totalViolations = rows.reduce((s, r) => s + (r.violations ?? 0), 0);
      const scores = completed.map((r) =>
        r.total_marks ? (r.score / r.total_marks) * 100 : 0
      );
      const averageScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      const highestScore = scores.length ? Math.max(...scores) : null;
      return { totalAttempts, totalViolations, averageScore, highestScore };
    },
  });
}
