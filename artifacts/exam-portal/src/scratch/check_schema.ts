import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cqjjbvccldipkqqtqzqc.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxampidmNjbGRpcGtxcXRxenFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5NTk5NywiZXhwIjoyMDg1OTcxOTk3fQ.X66_viw192Ra2brJpf_XoePPnGvOD5V-A-t5kBQptNg";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function addAnswersColumn() {
  console.log("Attempting to add 'student_answers' column to 'exam_submissions' table...");
  try {
    // We try to run a query that might exist or just perform an update that fails if column doesn't exist
    // Actually, we can check columns by trying to select it.
    const { data, error } = await supabase
      .from("exam_submissions")
      .select("student_answers")
      .limit(1);

    if (error && error.message.includes('column "student_answers" does not exist')) {
      console.log("Column does not exist. Please add it via Supabase SQL Editor:");
      console.log(`ALTER TABLE exam_submissions ADD COLUMN student_answers JSONB DEFAULT '{}'::jsonb;`);
    } else if (error) {
      console.error("Error checking column:", error);
    } else {
      console.log("Column already exists!");
    }
  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

addAnswersColumn();
