import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type StudentProfile } from "@/lib/supabase";

export function useProfile(uid: string | undefined) {
  return useQuery({
    queryKey: ["profile", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      if (error) throw error;
      return data as StudentProfile | null;
    },
  });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Omit<StudentProfile, "created_at">) => {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(profile, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data as StudentProfile;
    },
    onSuccess: (data) => {
      qc.setQueryData(["profile", data.id], data);
    },
  });
}
