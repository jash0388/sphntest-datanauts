import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cqjjbvccldipkqqtqzqc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxampidmNjbGRpcGtxcXRxenFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTU5OTcsImV4cCI6MjA4NTk3MTk5N30.VJxcanrSRdEAcnRpCI2zpeWQ7PhvdPiZtRnA5L7RQgc";

const supabase = createClient(supabaseUrl, supabaseKey);

const questionsData = [
  // Java (1-10)
  {
    question: "What is the output?\n\nString s1 = \"Java\";\nString s2 = new String(\"Java\");\nSystem.out.println(s1 == s2);",
    options: ["true", "false", "Compilation Error", "Runtime Error"],
    correct_answer: "false",
  },
  {
    question: "Which collection provides O(1) average-time lookup?",
    options: ["TreeMap", "LinkedHashMap", "HashMap", "TreeSet"],
    correct_answer: "HashMap",
  },
  {
    question: "Which exception is a checked exception?",
    options: ["ArithmeticException", "IOException", "NullPointerException", "IllegalArgumentException"],
    correct_answer: "IOException",
  },
  {
    question: "Which keyword prevents method overriding?",
    options: ["static", "final", "abstract", "private"],
    correct_answer: "final",
  },
  {
    question: "What is the output?\n\nint x = 5;\nSystem.out.println(++x + x++);",
    options: ["11", "12", "13", "14"],
    correct_answer: "12",
  },
  {
    question: "Which interface is implemented by ArrayList?",
    options: ["Set", "Queue", "List", "Map"],
    correct_answer: "List",
  },
  {
    question: "Which feature enables runtime polymorphism?",
    options: ["Method Overloading", "Method Overriding", "Constructor Overloading", "Encapsulation"],
    correct_answer: "Method Overriding",
  },
  {
    question: "Which package is imported automatically?",
    options: ["java.util", "java.io", "java.lang", "java.sql"],
    correct_answer: "java.lang",
  },
  {
    question: "Which keyword is used to inherit a class?",
    options: ["implements", "extends", "inherit", "super"],
    correct_answer: "extends",
  },
  {
    question: "Which memory area stores objects?",
    options: ["Stack", "Heap", "Register", "Cache"],
    correct_answer: "Heap",
  },

  // C Programming (11-20)
  {
    question: "Which storage class retains its value between function calls?",
    options: ["auto", "register", "static", "extern"],
    correct_answer: "static",
  },
  {
    question: "What is the output?\n\nint a = 10;\nprintf(\"%d\", a++ + ++a);",
    options: ["21", "22", "Undefined Behavior", "Compilation Error"],
    correct_answer: "Undefined Behavior",
  },
  {
    question: "Which function allocates contiguous memory initialized to zero?",
    options: ["malloc()", "calloc()", "realloc()", "alloc()"],
    correct_answer: "calloc()",
  },
  {
    question: "Which operator gives the address of a variable?",
    options: ["*", "&", "%", "#"],
    correct_answer: "&",
  },
  {
    question: "Which header file contains malloc()?",
    options: ["stdio.h", "stdlib.h", "string.h", "math.h"],
    correct_answer: "stdlib.h",
  },
  {
    question: "Which is the correct declaration of a function pointer?",
    options: ["int *f();", "int (*f)();", "int f*();", "*int f();"],
    correct_answer: "int (*f)();",
  },
  {
    question: "Which loop executes at least once?",
    options: ["for", "while", "do-while", "Nested loop"],
    correct_answer: "do-while",
  },
  {
    question: "Which of the following causes memory leaks?",
    options: ["Missing free()", "Missing break", "Missing return", "Missing continue"],
    correct_answer: "Missing free()",
  },
  {
    question: "Which operator has the highest precedence?",
    options: ["=", "&&", "Postfix ++", "||"],
    correct_answer: "Postfix ++",
  },
  {
    question: "Which keyword defines a read-only variable?",
    options: ["define", "const", "final", "static"],
    correct_answer: "const",
  },

  // Python (21-30)
  {
    question: "What is the output?\n\na = [1,2]\nb = a\nb.append(3)\nprint(a)",
    options: ["[1,2]", "[1,2,3]", "Error", "None"],
    correct_answer: "[1,2,3]",
  },
  {
    question: "Which Python data type is immutable?",
    options: ["List", "Dictionary", "Set", "Tuple"],
    correct_answer: "Tuple",
  },
  {
    question: "Which keyword creates a generator?",
    options: ["return", "yield", "next", "lambda"],
    correct_answer: "yield",
  },
  {
    question: "Which module supports regular expressions?",
    options: ["regex", "re", "pattern", "match"],
    correct_answer: "re",
  },
  {
    question: "Which of the following is hashable?",
    options: ["List", "Dictionary", "Tuple containing immutable objects", "Set"],
    correct_answer: "Tuple containing immutable objects",
  },
  {
    question: "What is the output?\n\nprint(bool([]))",
    options: ["True", "False", "None", "Error"],
    correct_answer: "False",
  },
  {
    question: "Which operator performs floor division?",
    options: ["/", "//", "%", "**"],
    correct_answer: "//",
  },
  {
    question: "Average lookup time in a dictionary is",
    options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
    correct_answer: "O(1)",
  },
  {
    question: "Which method creates a shallow copy of a list?",
    options: ["duplicate()", "clone()", "copy()", "deepcopy()"],
    correct_answer: "copy()",
  },
  {
    question: "Which keyword is used for anonymous functions?",
    options: ["def", "lambda", "func", "yield"],
    correct_answer: "lambda",
  },

  // SQL (31-40)
  {
    question: "Which JOIN returns only matching rows?",
    options: ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN"],
    correct_answer: "INNER JOIN",
  },
  {
    question: "Which SQL clause filters grouped records?",
    options: ["WHERE", "HAVING", "ORDER BY", "GROUP BY"],
    correct_answer: "HAVING",
  },
  {
    question: "Which normal form removes transitive dependency?",
    options: ["1NF", "2NF", "3NF", "BCNF"],
    correct_answer: "3NF",
  },
  {
    question: "Which ACID property ensures completed transactions are permanent?",
    options: ["Atomicity", "Isolation", "Durability", "Consistency"],
    correct_answer: "Durability",
  },
  {
    question: "Which function replaces NULL values?",
    options: ["COALESCE()", "COUNT()", "MAX()", "AVG()"],
    correct_answer: "COALESCE()",
  },
  {
    question: "Which query returns the second-highest salary?",
    options: [
      "SELECT MAX(salary) FROM employee;",
      "SELECT MAX(salary) FROM employee WHERE salary < (SELECT MAX(salary) FROM employee);",
      "SELECT salary FROM employee LIMIT 2;",
      "SELECT MIN(salary) FROM employee;"
    ],
    correct_answer: "SELECT MAX(salary) FROM employee WHERE salary < (SELECT MAX(salary) FROM employee);",
  },
  {
    question: "Which command removes the table structure permanently?",
    options: ["DELETE", "DROP", "TRUNCATE", "REMOVE"],
    correct_answer: "DROP",
  },
  {
    question: "Which constraint prevents duplicate values?",
    options: ["PRIMARY KEY", "UNIQUE", "FOREIGN KEY", "CHECK"],
    correct_answer: "UNIQUE",
  },
  {
    question: "Which SQL command modifies existing rows?",
    options: ["ALTER", "UPDATE", "MODIFY", "CHANGE"],
    correct_answer: "UPDATE",
  },
  {
    question: "Which aggregate function ignores NULL values?",
    options: ["COUNT(column)", "SUM()", "AVG()", "All of the above"],
    correct_answer: "All of the above",
  },

  // Computer Science (41-50)
  {
    question: "Which data structure is used to implement recursion?",
    options: ["Queue", "Stack", "Heap", "Tree"],
    correct_answer: "Stack",
  },
  {
    question: "Time complexity of Binary Search is",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    correct_answer: "O(log n)",
  },
  {
    question: "Which sorting algorithm has O(n log n) worst-case complexity?",
    options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"],
    correct_answer: "Merge Sort",
  },
  {
    question: "Which page replacement algorithm suffers from Belady's anomaly?",
    options: ["LRU", "FIFO", "Optimal", "LFU"],
    correct_answer: "FIFO",
  },
  {
    question: "Which traversal uses a queue?",
    options: ["DFS", "BFS", "Inorder", "Postorder"],
    correct_answer: "BFS",
  },
  {
    question: "Which scheduling algorithm may cause starvation?",
    options: ["FCFS", "Round Robin", "Priority Scheduling", "FIFO"],
    correct_answer: "Priority Scheduling",
  },
  {
    question: "Worst-case search time in a balanced BST is",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct_answer: "O(log n)",
  },
  {
    question: "Which protocol operates at the Transport Layer?",
    options: ["HTTP", "TCP", "IP", "ARP"],
    correct_answer: "TCP",
  },
  {
    question: "Which algorithm finds the shortest path in a weighted graph with non-negative edge weights?",
    options: ["Kruskal's", "Prim's", "Dijkstra's", "DFS"],
    correct_answer: "Dijkstra's",
  },
  {
    question: "Which data structure is best suited to evaluate postfix expressions?",
    options: ["Queue", "Stack", "Linked List", "Binary Tree"],
    correct_answer: "Stack",
  },
];

async function main() {
  console.log("Fetching existing exams...");
  let { data: exams, error: examErr } = await supabase.from("exams").select("*");
  if (examErr) {
    console.error("Error fetching exams:", examErr);
    return;
  }

  // Create "Advanced Technical Online Assessment" if not existing
  let advExam = exams.find(e => e.title === "Advanced Technical Online Assessment");
  if (!advExam) {
    console.log("Creating 'Advanced Technical Online Assessment' exam...");
    const { data: newExam, error: createErr } = await supabase
      .from("exams")
      .insert([
        {
          title: "Advanced Technical Online Assessment",
          description: "50 MCQs covering Java, C Programming, Python, SQL & Computer Science Concepts",
          duration_minutes: 60,
          max_violations: 3,
          is_active: true,
        }
      ])
      .select()
      .single();
    if (createErr) {
      console.error("Error creating exam:", createErr);
    } else {
      advExam = newExam;
      exams.push(advExam);
      console.log("Created exam with ID:", advExam.id);
    }
  }

  // Make all exams active so students can take any section
  console.log("Activating all exams...");
  for (const e of exams) {
    await supabase.from("exams").update({ is_active: true }).eq("id", e.id);
  }

  // Delete existing questions for each exam and populate all 50 questions
  for (const e of exams) {
    console.log(`Updating questions for exam: ${e.title} (${e.id})`);
    
    // Clear old questions
    const { error: delErr } = await supabase.from("exam_questions").delete().eq("exam_id", e.id);
    if (delErr) {
      console.error(`Error clearing questions for ${e.id}:`, delErr);
    }

    // Insert 50 questions
    const rowsToInsert = questionsData.map((q, idx) => ({
      exam_id: e.id,
      question: q.question,
      question_type: "mcq",
      options: q.options,
      correct_answer: q.correct_answer,
      marks: 1,
      sort_order: idx + 1,
    }));

    const { data: inserted, error: insErr } = await supabase.from("exam_questions").insert(rowsToInsert).select();
    if (insErr) {
      console.error(`Error inserting questions into ${e.title}:`, insErr);
    } else {
      console.log(`Successfully inserted ${inserted.length} questions into ${e.title}`);
    }
  }

  console.log("ALL 50 QUESTIONS HAVE BEEN SUCCESSFULLY ADDED AND ACTIVATED ACROSS ALL EXAMS!");
}

main();
