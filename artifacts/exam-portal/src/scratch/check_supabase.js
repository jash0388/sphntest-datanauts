import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cqjjbvccldipkqqtqzqc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxampidmNjbGRpcGtxcXRxenFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5NTk5NywiZXhwIjoyMDg1OTcxOTk3fQ.X66_viw192Ra2brJpf_XoePPnGvOD5V-A-t5kBQptNg"; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking exams...");
  const { data: exams, error: examsError } = await supabase.from("exams").select("*");
  if (examsError) {
    console.error("Exams error:", examsError);
  } else {
    console.log("Exams count:", exams.length);
    console.log(JSON.stringify(exams, null, 2));
  }

  console.log("Checking questions...");
  const { data: questions, error: qError } = await supabase.from("exam_questions").select("*");
  if (qError) {
    console.error("Questions error:", qError);
  } else {
    console.log("Questions count:", questions.length);
  }
}

main();
