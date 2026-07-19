import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cqjjbvccldipkqqtqzqc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxampidmNjbGRpcGtxcXRxenFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5NTk5NywiZXhwIjoyMDg1OTcxOTk3fQ.X66_viw192Ra2brJpf_XoePPnGvOD5V-A-t5kBQptNg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Looking for the SIP Selection Test exam...");

  let { data: existingExam } = await supabase
    .from("exams")
    .select("id, title")
    .ilike("title", "%SIP%")
    .single();

  let examId;

  if (existingExam) {
    examId = existingExam.id;
    console.log("Found existing exam:", examId, existingExam.title);
    const { error: delErr } = await supabase
      .from("exam_questions")
      .delete()
      .eq("exam_id", examId);
    if (delErr) { console.error("Error deleting old questions:", delErr); return; }
    console.log("Deleted old questions.");
    await supabase.from("exams").update({
      title: "SIP Selection Test",
      description: "SIP Selection Test — Section A, B & C covering C++, Python, Java, SQL, and Computer Science.",
      duration_minutes: 45,
      max_violations: 3,
      is_active: true,
    }).eq("id", examId);
  } else {
    const { data: newExam, error: createErr } = await supabase
      .from("exams")
      .insert({
        title: "SIP Selection Test",
        description: "SIP Selection Test — Section A, B & C covering C++, Python, Java, SQL, and Computer Science.",
        duration_minutes: 45,
        max_violations: 3,
        is_active: true,
      })
      .select().single();
    if (createErr) { console.error("Error creating exam:", createErr); return; }
    examId = newExam.id;
    console.log("Created new exam:", examId);
  }

  const questions = [
    // ── SECTION A | Part A — MCQs ──
    { question: "SECTION A | C++ | Output of: int a=10; int b=20; cout<<a+b*2;", question_type: "mcq", options: ["60","40","50","30"], correct_answer: "50", marks: 1, sort_order: 1 },
    { question: "SECTION A | C++ | Output of: int x=5; cout<<++x;", question_type: "mcq", options: ["5","6","Error","Undefined"], correct_answer: "6", marks: 1, sort_order: 2 },
    { question: "SECTION A | C++ | Correct integer array declaration of size 5", question_type: "mcq", options: ["int arr(5);","array int[5];","int arr[5];","arr int[5];"], correct_answer: "int arr[5];", marks: 1, sort_order: 3 },
    { question: "SECTION A | C++ | Best loop when iterations are known in advance", question_type: "mcq", options: ["while","do-while","for","switch"], correct_answer: "for", marks: 1, sort_order: 4 },
    { question: "SECTION A | Python | Output of: a=[10,20,30]; print(len(a))", question_type: "mcq", options: ["2","3","30","Error"], correct_answer: "3", marks: 1, sort_order: 5 },
    { question: "SECTION A | Python | Output of: for i in range(1,5): print(i,end=' ')", question_type: "mcq", options: ["1 2 3 4","1 2 3 4 5","0 1 2 3 4","Error"], correct_answer: "1 2 3 4", marks: 1, sort_order: 6 },
    { question: "SECTION A | Python | Which data structure does NOT allow duplicates?", question_type: "mcq", options: ["List","Tuple","Set","Dictionary"], correct_answer: "Set", marks: 1, sort_order: 7 },
    { question: "SECTION A | Python | Keyword to handle exceptions in Python", question_type: "mcq", options: ["catch","except","error","throw"], correct_answer: "except", marks: 1, sort_order: 8 },
    { question: "SECTION A | Java | OOP principle allowing multiple forms of a method", question_type: "mcq", options: ["Encapsulation","Inheritance","Polymorphism","Abstraction"], correct_answer: "Polymorphism", marks: 1, sort_order: 9 },
    { question: "SECTION A | Java | Access modifier restricting to same class only", question_type: "mcq", options: ["public","protected","private","default"], correct_answer: "private", marks: 1, sort_order: 10 },
    { question: "SECTION A | Java | True statement about constructors", question_type: "mcq", options: ["have return type","called automatically on object creation","must be static","cannot be overloaded"], correct_answer: "called automatically on object creation", marks: 1, sort_order: 11 },
    { question: "SECTION A | Java | Collection storing only unique elements", question_type: "mcq", options: ["ArrayList","LinkedList","HashSet","Vector"], correct_answer: "HashSet", marks: 1, sort_order: 12 },
    { question: "SECTION A | SQL | SQL stands for", question_type: "mcq", options: ["Structured Query Language","Standard Query Logic","Structured Question Language","Simple Query Language"], correct_answer: "Structured Query Language", marks: 1, sort_order: 13 },
    { question: "SECTION A | SQL | Command to retrieve data", question_type: "mcq", options: ["INSERT","UPDATE","SELECT","DELETE"], correct_answer: "SELECT", marks: 1, sort_order: 14 },
    { question: "SECTION A | SQL | Clause that filters rows", question_type: "mcq", options: ["GROUP BY","WHERE","ORDER BY","HAVING"], correct_answer: "WHERE", marks: 1, sort_order: 15 },
    { question: "SECTION A | SQL | Command to add new rows", question_type: "mcq", options: ["INSERT","ADD","UPDATE","CREATE"], correct_answer: "INSERT", marks: 1, sort_order: 16 },
    { question: "SECTION A | CS | Data structure with FIFO", question_type: "mcq", options: ["Stack","Queue","Tree","Graph"], correct_answer: "Queue", marks: 1, sort_order: 17 },
    { question: "SECTION A | CS | Searching algorithm requiring sorted data", question_type: "mcq", options: ["Linear Search","Binary Search","DFS","BFS"], correct_answer: "Binary Search", marks: 1, sort_order: 18 },
    { question: "SECTION A | CS | Sorting algorithm that repeatedly swaps adjacent elements", question_type: "mcq", options: ["Merge Sort","Bubble Sort","Quick Sort","Heap Sort"], correct_answer: "Bubble Sort", marks: 1, sort_order: 19 },
    { question: "SECTION A | CS | Protocol mainly used to transfer web pages", question_type: "mcq", options: ["FTP","SMTP","HTTP","SSH"], correct_answer: "HTTP", marks: 1, sort_order: 20 },
    // ── SECTION A | Part B — Fill in the Blanks ──
    { question: "SECTION A | Part B | In C++, pass-by-reference uses the ______ symbol.", question_type: "fill_blank", options: null, correct_answer: "&", marks: 1, sort_order: 21 },
    { question: "SECTION A | Part B | The operator used to find the remainder in C++ is ______.", question_type: "fill_blank", options: null, correct_answer: "%", marks: 1, sort_order: 22 },
    { question: "SECTION A | Part B | Python's range(5) generates numbers from ______ to ______.", question_type: "fill_blank", options: null, correct_answer: "0, 4", marks: 1, sort_order: 23 },
    { question: "SECTION A | Part B | The keyword used to define a function in Python is ______.", question_type: "fill_blank", options: null, correct_answer: "def", marks: 1, sort_order: 24 },
    { question: "SECTION A | Part B | The keyword used to create an object in Java is ______.", question_type: "fill_blank", options: null, correct_answer: "new", marks: 1, sort_order: 25 },
    { question: "SECTION A | Part B | The default value of a boolean variable in Java is ______.", question_type: "fill_blank", options: null, correct_answer: "false", marks: 1, sort_order: 26 },
    { question: "SECTION A | Part B | The SQL function used to calculate the average is ______.", question_type: "fill_blank", options: null, correct_answer: "AVG", marks: 1, sort_order: 27 },
    { question: "SECTION A | Part B | The SQL command used to remove duplicate rows from the result is ______.", question_type: "fill_blank", options: null, correct_answer: "DISTINCT", marks: 1, sort_order: 28 },
    { question: "SECTION A | Part B | A stack follows the ______ principle.", question_type: "fill_blank", options: null, correct_answer: "LIFO", marks: 1, sort_order: 29 },
    { question: "SECTION A | Part B | The process of finding and fixing errors in a program is called ______.", question_type: "fill_blank", options: null, correct_answer: "Debugging", marks: 1, sort_order: 30 },

    // ── SECTION B | Part A — MCQs ──
    { question: "SECTION B | C++ | Output of: int a=15,b=4; cout<<a%b;", question_type: "mcq", options: ["3","4","15","1"], correct_answer: "3", marks: 1, sort_order: 31 },
    { question: "SECTION B | C++ | Output of: int x=8; cout<<x--; cout<<x;", question_type: "mcq", options: ["87","78","88","77"], correct_answer: "87", marks: 1, sort_order: 32 },
    { question: "SECTION B | C++ | Keyword to return a value from a function", question_type: "mcq", options: ["break","return","exit","goto"], correct_answer: "return", marks: 1, sort_order: 33 },
    { question: "SECTION B | C++ | Output of: int arr[]={2,4,6}; cout<<arr[1];", question_type: "mcq", options: ["2","4","6","Error"], correct_answer: "4", marks: 1, sort_order: 34 },
    { question: "SECTION B | Python | Output of: a=[5,10,15]; print(a[0])", question_type: "mcq", options: ["5","10","15","Error"], correct_answer: "5", marks: 1, sort_order: 35 },
    { question: "SECTION B | Python | Output of if/else with x=7, checking x>5", question_type: "mcq", options: ["Yes","No","Error","Nothing"], correct_answer: "Yes", marks: 1, sort_order: 36 },
    { question: "SECTION B | Python | Function to get user input", question_type: "mcq", options: ["print()","scan()","input()","read()"], correct_answer: "input()", marks: 1, sort_order: 37 },
    { question: "SECTION B | Python | Immutable type in Python", question_type: "mcq", options: ["List","Dictionary","Tuple","Set"], correct_answer: "Tuple", marks: 1, sort_order: 38 },
    { question: "SECTION B | Java | Output of: int a=5; System.out.println(a++);", question_type: "mcq", options: ["5","6","Error","4"], correct_answer: "5", marks: 1, sort_order: 39 },
    { question: "SECTION B | Java | Keyword to inherit a class", question_type: "mcq", options: ["implements","extends","inherits","using"], correct_answer: "extends", marks: 1, sort_order: 40 },
    { question: "SECTION B | Java | Entry point of every Java program", question_type: "mcq", options: ["start()","execute()","main()","run()"], correct_answer: "main()", marks: 1, sort_order: 41 },
    { question: "SECTION B | Java | NOT a primitive data type", question_type: "mcq", options: ["int","float","String","char"], correct_answer: "String", marks: 1, sort_order: 42 },
    { question: "SECTION B | SQL | Command to modify existing records", question_type: "mcq", options: ["ALTER","UPDATE","MODIFY","CHANGE"], correct_answer: "UPDATE", marks: 1, sort_order: 43 },
    { question: "SECTION B | SQL | Command to remove a table", question_type: "mcq", options: ["DELETE","REMOVE","DROP","ERASE"], correct_answer: "DROP", marks: 1, sort_order: 44 },
    { question: "SECTION B | SQL | Keyword to sort records", question_type: "mcq", options: ["SORT","ORDER BY","GROUP BY","FILTER"], correct_answer: "ORDER BY", marks: 1, sort_order: 45 },
    { question: "SECTION B | SQL | Function to count rows", question_type: "mcq", options: ["TOTAL()","SUM()","COUNT()","NUMBER()"], correct_answer: "COUNT()", marks: 1, sort_order: 46 },
    { question: "SECTION B | CS | Sorting algorithm dividing array into halves", question_type: "mcq", options: ["Bubble Sort","Merge Sort","Selection Sort","Insertion Sort"], correct_answer: "Merge Sort", marks: 1, sort_order: 47 },
    { question: "SECTION B | CS | Data structure with LIFO", question_type: "mcq", options: ["Queue","Stack","Tree","Graph"], correct_answer: "Stack", marks: 1, sort_order: 48 },
    { question: "SECTION B | CS | Memory retaining data after power off", question_type: "mcq", options: ["RAM","Cache","ROM","Register"], correct_answer: "ROM", marks: 1, sort_order: 49 },
    { question: "SECTION B | CS | OSI layer responsible for routing", question_type: "mcq", options: ["Physical","Data Link","Network","Application"], correct_answer: "Network", marks: 1, sort_order: 50 },
    // ── SECTION B | Part B — Fill in the Blanks ──
    { question: "SECTION B | Part B | The C++ keyword used to define a constant is ________.", question_type: "fill_blank", options: null, correct_answer: "const", marks: 1, sort_order: 51 },
    { question: "SECTION B | Part B | In C++, array indexing starts from ________.", question_type: "fill_blank", options: null, correct_answer: "0", marks: 1, sort_order: 52 },
    { question: "SECTION B | Part B | Python uses the ________ function to find the length of a list.", question_type: "fill_blank", options: null, correct_answer: "len()", marks: 1, sort_order: 53 },
    { question: "SECTION B | Part B | The keyword used to define a class in Python is ________.", question_type: "fill_blank", options: null, correct_answer: "class", marks: 1, sort_order: 54 },
    { question: "SECTION B | Part B | Java programs run on the ________.", question_type: "fill_blank", options: null, correct_answer: "JVM", marks: 1, sort_order: 55 },
    { question: "SECTION B | Part B | Java source files have the extension ________.", question_type: "fill_blank", options: null, correct_answer: ".java", marks: 1, sort_order: 56 },
    { question: "SECTION B | Part B | The SQL command used to remove a table permanently is ________.", question_type: "fill_blank", options: null, correct_answer: "DROP", marks: 1, sort_order: 57 },
    { question: "SECTION B | Part B | The SQL clause used to sort query results is ________.", question_type: "fill_blank", options: null, correct_answer: "ORDER BY", marks: 1, sort_order: 58 },
    { question: "SECTION B | Part B | The time complexity of Linear Search is ________.", question_type: "fill_blank", options: null, correct_answer: "O(n)", marks: 1, sort_order: 59 },
    { question: "SECTION B | Part B | The binary number system uses only the digits ________ and ________.", question_type: "fill_blank", options: null, correct_answer: "0, 1", marks: 1, sort_order: 60 },

    // ── SECTION C | Part A — MCQs ──
    { question: "SECTION C | C++ | Output of: int a=5,b=3; cout<<a/b;", question_type: "mcq", options: ["1","1.66","2","Error"], correct_answer: "1", marks: 1, sort_order: 61 },
    { question: "SECTION C | C++ | Output of a while loop printing i from 1 to 3", question_type: "mcq", options: ["012","123","321","Error"], correct_answer: "123", marks: 1, sort_order: 62 },
    { question: "SECTION C | C++ | Operator to access object members", question_type: "mcq", options: ["::",".","->&","&"], correct_answer: ".", marks: 1, sort_order: 63 },
    { question: "SECTION C | C++ | Valid function declaration", question_type: "mcq", options: ["int sum(int,int);","sum(int,int);","function sum();","int sum=();"], correct_answer: "int sum(int,int);", marks: 1, sort_order: 64 },
    { question: "SECTION C | Python | Output of: print(x>y) where x=10, y=20", question_type: "mcq", options: ["True","False","10","Error"], correct_answer: "False", marks: 1, sort_order: 65 },
    { question: "SECTION C | Python | Output of: a=[1,2,3]; a.append(4); print(a)", question_type: "mcq", options: ["[1,2,3]","[4]","[1,2,3,4]","Error"], correct_answer: "[1,2,3,4]", marks: 1, sort_order: 66 },
    { question: "SECTION C | Python | Keyword to define a class in Python", question_type: "mcq", options: ["object","define","class","new"], correct_answer: "class", marks: 1, sort_order: 67 },
    { question: "SECTION C | Python | Function converting string to integer", question_type: "mcq", options: ["float()","str()","int()","char()"], correct_answer: "int()", marks: 1, sort_order: 68 },
    { question: "SECTION C | Java | Output of: int x=10; System.out.println(++x);", question_type: "mcq", options: ["10","11","9","Error"], correct_answer: "11", marks: 1, sort_order: 69 },
    { question: "SECTION C | Java | Package imported automatically in every Java program", question_type: "mcq", options: ["java.io","java.util","java.lang","java.sql"], correct_answer: "java.lang", marks: 1, sort_order: 70 },
    { question: "SECTION C | Java | Keyword referring to current object", question_type: "mcq", options: ["self","this","super","current"], correct_answer: "this", marks: 1, sort_order: 71 },
    { question: "SECTION C | Java | Keyword to prevent inheritance", question_type: "mcq", options: ["static","final","private","const"], correct_answer: "final", marks: 1, sort_order: 72 },
    { question: "SECTION C | SQL | SQL statement to create a database object", question_type: "mcq", options: ["CREATE","INSERT","UPDATE","SELECT"], correct_answer: "CREATE", marks: 1, sort_order: 73 },
    { question: "SECTION C | SQL | Clause that groups similar records", question_type: "mcq", options: ["GROUP BY","SORT BY","WHERE","HAVING"], correct_answer: "GROUP BY", marks: 1, sort_order: 74 },
    { question: "SECTION C | SQL | SQL function returning highest value", question_type: "mcq", options: ["TOP()","MAX()","HIGH()","UPPER()"], correct_answer: "MAX()", marks: 1, sort_order: 75 },
    { question: "SECTION C | SQL | Command removing all rows but keeping structure", question_type: "mcq", options: ["DROP","DELETE","TRUNCATE","REMOVE"], correct_answer: "TRUNCATE", marks: 1, sort_order: 76 },
    { question: "SECTION C | CS | NOT a linear data structure", question_type: "mcq", options: ["Array","Linked List","Queue","Tree"], correct_answer: "Tree", marks: 1, sort_order: 77 },
    { question: "SECTION C | CS | Traversal technique using a queue", question_type: "mcq", options: ["DFS","BFS","Inorder","Postorder"], correct_answer: "BFS", marks: 1, sort_order: 78 },
    { question: "SECTION C | CS | Fastest memory in a computer", question_type: "mcq", options: ["RAM","SSD","Cache","Hard Disk"], correct_answer: "Cache", marks: 1, sort_order: 79 },
    { question: "SECTION C | CS | Protocol used to transfer files", question_type: "mcq", options: ["HTTP","FTP","SMTP","DNS"], correct_answer: "FTP", marks: 1, sort_order: 80 },
    // ── SECTION C | Part B — Fill in the Blanks ──
    { question: "SECTION C | Part B | The C++ operator used for dynamic memory allocation is ________.", question_type: "fill_blank", options: null, correct_answer: "new", marks: 1, sort_order: 81 },
    { question: "SECTION C | Part B | A function that does not return any value in C++ has the return type ________.", question_type: "fill_blank", options: null, correct_answer: "void", marks: 1, sort_order: 82 },
    { question: "SECTION C | Part B | Python uses ________ to define code blocks instead of braces.", question_type: "fill_blank", options: null, correct_answer: "indentation", marks: 1, sort_order: 83 },
    { question: "SECTION C | Part B | The Python method used to add an element at the end of a list is ________.", question_type: "fill_blank", options: null, correct_answer: "append()", marks: 1, sort_order: 84 },
    { question: "SECTION C | Part B | Java programs are compiled into ________ before execution.", question_type: "fill_blank", options: null, correct_answer: "bytecode", marks: 1, sort_order: 85 },
    { question: "SECTION C | Part B | The keyword used to inherit a class in Java is ________.", question_type: "fill_blank", options: null, correct_answer: "extends", marks: 1, sort_order: 86 },
    { question: "SECTION C | Part B | The SQL function used to find the maximum value is ________.", question_type: "fill_blank", options: null, correct_answer: "MAX", marks: 1, sort_order: 87 },
    { question: "SECTION C | Part B | The SQL command used to delete all records from a table while keeping its structure is ________.", question_type: "fill_blank", options: null, correct_answer: "TRUNCATE", marks: 1, sort_order: 88 },
    { question: "SECTION C | Part B | Binary Search has a time complexity of ________.", question_type: "fill_blank", options: null, correct_answer: "O(log n)", marks: 1, sort_order: 89 },
    { question: "SECTION C | Part B | The process of arranging data in ascending or descending order is called ________.", question_type: "fill_blank", options: null, correct_answer: "Sorting", marks: 1, sort_order: 90 },
  ];

  const questionsWithExam = questions.map((q) => ({ ...q, exam_id: examId }));

  for (let i = 0; i < questionsWithExam.length; i += 30) {
    const batch = questionsWithExam.slice(i, i + 30);
    const { error } = await supabase.from("exam_questions").insert(batch);
    if (error) { console.error(`Error inserting batch at ${i}:`, error); return; }
    console.log(`Inserted questions ${i + 1}–${Math.min(i + 30, questionsWithExam.length)}`);
  }

  console.log(`\n✅ Done! Exam ID: ${examId} | Total questions: ${questionsWithExam.length}`);
}

main();
