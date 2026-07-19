import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cqjjbvccldipkqqtqzqc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxampidmNjbGRpcGtxcXRxenFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5NTk5NywiZXhwIjoyMDg1OTcxOTk3fQ.X66_viw192Ra2brJpf_XoePPnGvOD5V-A-t5kBQptNg"; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Seeding exam...");

  // Let's activate the MYSQL exam and Software Engineering exam too
  await supabase.from("exams").update({ is_active: true }).eq("title", "MYSQL");
  await supabase.from("exams").update({ is_active: true }).eq("title", "Software Engineering — Fill in the Blanks");

  // Create a new general knowledge and web tech exam
  const newExam = {
    title: "General Knowledge & Web Technology Assessment",
    description: "Assess your general knowledge and web development skills, including HTML, CSS, JavaScript, and database basics.",
    duration_minutes: 15,
    max_violations: 5,
    is_active: true,
  };

  const { data: insertedExam, error: examError } = await supabase
    .from("exams")
    .insert(newExam)
    .select()
    .single();

  if (examError) {
    console.error("Error inserting exam:", examError);
    return;
  }

  console.log("Inserted Exam ID:", insertedExam.id);

  const questions = [
    {
      exam_id: insertedExam.id,
      question: "What is the primary function of HTML in web development?",
      question_type: "mcq",
      options: [
        "To define the styling of the webpage",
        "To structure the content of the webpage",
        "To provide database connectivity",
        "To run server-side logic"
      ],
      correct_answer: "To structure the content of the webpage",
      marks: 2,
      sort_order: 1
    },
    {
      exam_id: insertedExam.id,
      question: "Which JavaScript keyword is used to declare a block-scoped variable?",
      question_type: "mcq",
      options: [
        "var",
        "let",
        "const",
        "Both let and const"
      ],
      correct_answer: "Both let and const",
      marks: 2,
      sort_order: 2
    },
    {
      exam_id: insertedExam.id,
      question: "What does CSS stand for?",
      question_type: "mcq",
      options: [
        "Creative Style Sheets",
        "Cascading Style Sheets",
        "Computer Style Sheets",
        "Colorful Style Sheets"
      ],
      correct_answer: "Cascading Style Sheets",
      marks: 2,
      sort_order: 3
    },
    {
      exam_id: insertedExam.id,
      question: "Explain the difference between Client-side rendering (CSR) and Server-side rendering (SSR).",
      question_type: "paragraph",
      options: null,
      correct_answer: null,
      marks: 5,
      sort_order: 4
    }
  ];

  const { error: questionsError } = await supabase
    .from("exam_questions")
    .insert(questions);

  if (questionsError) {
    console.error("Error inserting questions:", questionsError);
  } else {
    console.log("Successfully seeded new exam questions!");
  }
}

main();
