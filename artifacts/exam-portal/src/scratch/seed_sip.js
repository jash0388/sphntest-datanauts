import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cqjjbvccldipkqqtqzqc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxampidmNjbGRpcGtxcXRxenFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5NTk5NywiZXhwIjoyMDg1OTcxOTk3fQ.X66_viw192Ra2brJpf_XoePPnGvOD5V-A-t5kBQptNg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // ──────────────────────────────────────────
  // STEP 1: Delete ALL existing exams + questions
  // ──────────────────────────────────────────
  console.log("Fetching all exams...");
  const { data: allExams } = await supabase.from("exams").select("id, title");
  if (allExams && allExams.length > 0) {
    for (const exam of allExams) {
      await supabase.from("exam_questions").delete().eq("exam_id", exam.id);
      await supabase.from("exams").delete().eq("id", exam.id);
      console.log(`Deleted: ${exam.title} (${exam.id})`);
    }
  }
  console.log("All exams wiped.\n");

  // ──────────────────────────────────────────
  // STEP 2: Define the 3 sections
  // ──────────────────────────────────────────
  const sections = [
    {
      title: "SIP Selection Test — Section A",
      description: "Section A: C++, Python, Java, SQL & Computer Science — Part A (MCQs) and Part B (Fill in the Blanks)",
      questions: [
        // Part A — MCQs
        { question: "Output of: int a=10; int b=20; cout<<a+b*2;", question_type: "mcq", options: ["60","40","50","30"], correct_answer: "50", marks: 1, sort_order: 1 },
        { question: "Output of: int x=5; cout<<++x;", question_type: "mcq", options: ["5","6","Error","Undefined"], correct_answer: "6", marks: 1, sort_order: 2 },
        { question: "Correct integer array declaration of size 5", question_type: "mcq", options: ["int arr(5);","array int[5];","int arr[5];","arr int[5];"], correct_answer: "int arr[5];", marks: 1, sort_order: 3 },
        { question: "Best loop when iterations are known in advance", question_type: "mcq", options: ["while","do-while","for","switch"], correct_answer: "for", marks: 1, sort_order: 4 },
        { question: "Output of: a=[10,20,30]; print(len(a))", question_type: "mcq", options: ["2","3","30","Error"], correct_answer: "3", marks: 1, sort_order: 5 },
        { question: "Output of: for i in range(1,5): print(i,end=' ')", question_type: "mcq", options: ["1 2 3 4","1 2 3 4 5","0 1 2 3 4","Error"], correct_answer: "1 2 3 4", marks: 1, sort_order: 6 },
        { question: "Which data structure does NOT allow duplicates?", question_type: "mcq", options: ["List","Tuple","Set","Dictionary"], correct_answer: "Set", marks: 1, sort_order: 7 },
        { question: "Keyword to handle exceptions in Python", question_type: "mcq", options: ["catch","except","error","throw"], correct_answer: "except", marks: 1, sort_order: 8 },
        { question: "OOP principle allowing multiple forms of a method", question_type: "mcq", options: ["Encapsulation","Inheritance","Polymorphism","Abstraction"], correct_answer: "Polymorphism", marks: 1, sort_order: 9 },
        { question: "Access modifier restricting access to same class only", question_type: "mcq", options: ["public","protected","private","default"], correct_answer: "private", marks: 1, sort_order: 10 },
        { question: "True statement about constructors", question_type: "mcq", options: ["have return type","called automatically on object creation","must be static","cannot be overloaded"], correct_answer: "called automatically on object creation", marks: 1, sort_order: 11 },
        { question: "Java collection storing only unique elements", question_type: "mcq", options: ["ArrayList","LinkedList","HashSet","Vector"], correct_answer: "HashSet", marks: 1, sort_order: 12 },
        { question: "SQL stands for", question_type: "mcq", options: ["Structured Query Language","Standard Query Logic","Structured Question Language","Simple Query Language"], correct_answer: "Structured Query Language", marks: 1, sort_order: 13 },
        { question: "SQL command to retrieve data", question_type: "mcq", options: ["INSERT","UPDATE","SELECT","DELETE"], correct_answer: "SELECT", marks: 1, sort_order: 14 },
        { question: "SQL clause that filters rows", question_type: "mcq", options: ["GROUP BY","WHERE","ORDER BY","HAVING"], correct_answer: "WHERE", marks: 1, sort_order: 15 },
        { question: "SQL command to add new rows", question_type: "mcq", options: ["INSERT","ADD","UPDATE","CREATE"], correct_answer: "INSERT", marks: 1, sort_order: 16 },
        { question: "Data structure with FIFO ordering", question_type: "mcq", options: ["Stack","Queue","Tree","Graph"], correct_answer: "Queue", marks: 1, sort_order: 17 },
        { question: "Searching algorithm requiring sorted data", question_type: "mcq", options: ["Linear Search","Binary Search","DFS","BFS"], correct_answer: "Binary Search", marks: 1, sort_order: 18 },
        { question: "Sorting algorithm that repeatedly swaps adjacent elements", question_type: "mcq", options: ["Merge Sort","Bubble Sort","Quick Sort","Heap Sort"], correct_answer: "Bubble Sort", marks: 1, sort_order: 19 },
        { question: "Protocol mainly used to transfer web pages", question_type: "mcq", options: ["FTP","SMTP","HTTP","SSH"], correct_answer: "HTTP", marks: 1, sort_order: 20 },
        // Part B — Fill in the Blanks
        { question: "In C++, pass-by-reference uses the ______ symbol.", question_type: "fill_blank", options: null, correct_answer: "&", marks: 1, sort_order: 21 },
        { question: "The operator used to find the remainder in C++ is ______.", question_type: "fill_blank", options: null, correct_answer: "%", marks: 1, sort_order: 22 },
        { question: "Python's range(5) generates numbers from ______ to ______.", question_type: "fill_blank", options: null, correct_answer: "0, 4", marks: 1, sort_order: 23 },
        { question: "The keyword used to define a function in Python is ______.", question_type: "fill_blank", options: null, correct_answer: "def", marks: 1, sort_order: 24 },
        { question: "The keyword used to create an object in Java is ______.", question_type: "fill_blank", options: null, correct_answer: "new", marks: 1, sort_order: 25 },
        { question: "The default value of a boolean variable in Java is ______.", question_type: "fill_blank", options: null, correct_answer: "false", marks: 1, sort_order: 26 },
        { question: "The SQL function used to calculate the average is ______.", question_type: "fill_blank", options: null, correct_answer: "AVG", marks: 1, sort_order: 27 },
        { question: "The SQL command used to remove duplicate rows from the result is ______.", question_type: "fill_blank", options: null, correct_answer: "DISTINCT", marks: 1, sort_order: 28 },
        { question: "A stack follows the ______ principle.", question_type: "fill_blank", options: null, correct_answer: "LIFO", marks: 1, sort_order: 29 },
        { question: "The process of finding and fixing errors in a program is called ______.", question_type: "fill_blank", options: null, correct_answer: "Debugging", marks: 1, sort_order: 30 },
      ]
    },
    {
      title: "SIP Selection Test — Section B",
      description: "Section B: C++, Python, Java, SQL & Computer Science — Part A (MCQs) and Part B (Fill in the Blanks)",
      questions: [
        // Part A — MCQs
        { question: "Output of: int a=15,b=4; cout<<a%b;", question_type: "mcq", options: ["3","4","15","1"], correct_answer: "3", marks: 1, sort_order: 1 },
        { question: "Output of: int x=8; cout<<x--; cout<<x;", question_type: "mcq", options: ["87","78","88","77"], correct_answer: "87", marks: 1, sort_order: 2 },
        { question: "Keyword to return a value from a function", question_type: "mcq", options: ["break","return","exit","goto"], correct_answer: "return", marks: 1, sort_order: 3 },
        { question: "Output of: int arr[]={2,4,6}; cout<<arr[1];", question_type: "mcq", options: ["2","4","6","Error"], correct_answer: "4", marks: 1, sort_order: 4 },
        { question: "Output of: a=[5,10,15]; print(a[0])", question_type: "mcq", options: ["5","10","15","Error"], correct_answer: "5", marks: 1, sort_order: 5 },
        { question: "Output of if/else block: x=7, condition x>5 prints 'Yes' else 'No'", question_type: "mcq", options: ["Yes","No","Error","Nothing"], correct_answer: "Yes", marks: 1, sort_order: 6 },
        { question: "Python function to get user input", question_type: "mcq", options: ["print()","scan()","input()","read()"], correct_answer: "input()", marks: 1, sort_order: 7 },
        { question: "Immutable sequence type in Python", question_type: "mcq", options: ["List","Dictionary","Tuple","Set"], correct_answer: "Tuple", marks: 1, sort_order: 8 },
        { question: "Output of: int a=5; System.out.println(a++);", question_type: "mcq", options: ["5","6","Error","4"], correct_answer: "5", marks: 1, sort_order: 9 },
        { question: "Java keyword to inherit a class", question_type: "mcq", options: ["implements","extends","inherits","using"], correct_answer: "extends", marks: 1, sort_order: 10 },
        { question: "Entry point of every Java program", question_type: "mcq", options: ["start()","execute()","main()","run()"], correct_answer: "main()", marks: 1, sort_order: 11 },
        { question: "Which is NOT a primitive data type in Java?", question_type: "mcq", options: ["int","float","String","char"], correct_answer: "String", marks: 1, sort_order: 12 },
        { question: "SQL command to modify existing records", question_type: "mcq", options: ["ALTER","UPDATE","MODIFY","CHANGE"], correct_answer: "UPDATE", marks: 1, sort_order: 13 },
        { question: "SQL command to remove a table", question_type: "mcq", options: ["DELETE","REMOVE","DROP","ERASE"], correct_answer: "DROP", marks: 1, sort_order: 14 },
        { question: "SQL keyword to sort records", question_type: "mcq", options: ["SORT","ORDER BY","GROUP BY","FILTER"], correct_answer: "ORDER BY", marks: 1, sort_order: 15 },
        { question: "SQL function to count rows", question_type: "mcq", options: ["TOTAL()","SUM()","COUNT()","NUMBER()"], correct_answer: "COUNT()", marks: 1, sort_order: 16 },
        { question: "Sorting algorithm that divides array into halves", question_type: "mcq", options: ["Bubble Sort","Merge Sort","Selection Sort","Insertion Sort"], correct_answer: "Merge Sort", marks: 1, sort_order: 17 },
        { question: "Data structure with LIFO ordering", question_type: "mcq", options: ["Queue","Stack","Tree","Graph"], correct_answer: "Stack", marks: 1, sort_order: 18 },
        { question: "Memory that retains data after power off", question_type: "mcq", options: ["RAM","Cache","ROM","Register"], correct_answer: "ROM", marks: 1, sort_order: 19 },
        { question: "OSI layer responsible for routing", question_type: "mcq", options: ["Physical","Data Link","Network","Application"], correct_answer: "Network", marks: 1, sort_order: 20 },
        // Part B — Fill in the Blanks
        { question: "The C++ keyword used to define a constant is ________.", question_type: "fill_blank", options: null, correct_answer: "const", marks: 1, sort_order: 21 },
        { question: "In C++, array indexing starts from ________.", question_type: "fill_blank", options: null, correct_answer: "0", marks: 1, sort_order: 22 },
        { question: "Python uses the ________ function to find the length of a list.", question_type: "fill_blank", options: null, correct_answer: "len()", marks: 1, sort_order: 23 },
        { question: "The keyword used to define a class in Python is ________.", question_type: "fill_blank", options: null, correct_answer: "class", marks: 1, sort_order: 24 },
        { question: "Java programs run on the ________.", question_type: "fill_blank", options: null, correct_answer: "JVM", marks: 1, sort_order: 25 },
        { question: "Java source files have the extension ________.", question_type: "fill_blank", options: null, correct_answer: ".java", marks: 1, sort_order: 26 },
        { question: "The SQL command used to remove a table permanently is ________.", question_type: "fill_blank", options: null, correct_answer: "DROP", marks: 1, sort_order: 27 },
        { question: "The SQL clause used to sort query results is ________.", question_type: "fill_blank", options: null, correct_answer: "ORDER BY", marks: 1, sort_order: 28 },
        { question: "The time complexity of Linear Search is ________.", question_type: "fill_blank", options: null, correct_answer: "O(n)", marks: 1, sort_order: 29 },
        { question: "The binary number system uses only the digits ________ and ________.", question_type: "fill_blank", options: null, correct_answer: "0, 1", marks: 1, sort_order: 30 },
      ]
    },
    {
      title: "SIP Selection Test — Section C",
      description: "Section C: C++, Python, Java, SQL & Computer Science — Part A (MCQs) and Part B (Fill in the Blanks)",
      questions: [
        // Part A — MCQs
        { question: "Output of: int a=5,b=3; cout<<a/b;", question_type: "mcq", options: ["1","1.66","2","Error"], correct_answer: "1", marks: 1, sort_order: 1 },
        { question: "Output of a while loop printing i from 1 to 3", question_type: "mcq", options: ["012","123","321","Error"], correct_answer: "123", marks: 1, sort_order: 2 },
        { question: "C++ operator to access object members", question_type: "mcq", options: ["::",".","->&","&"], correct_answer: ".", marks: 1, sort_order: 3 },
        { question: "Valid C++ function declaration", question_type: "mcq", options: ["int sum(int,int);","sum(int,int);","function sum();","int sum=();"], correct_answer: "int sum(int,int);", marks: 1, sort_order: 4 },
        { question: "Output of: print(x>y) where x=10, y=20", question_type: "mcq", options: ["True","False","10","Error"], correct_answer: "False", marks: 1, sort_order: 5 },
        { question: "Output of: a=[1,2,3]; a.append(4); print(a)", question_type: "mcq", options: ["[1,2,3]","[4]","[1,2,3,4]","Error"], correct_answer: "[1,2,3,4]", marks: 1, sort_order: 6 },
        { question: "Keyword to define a class in Python", question_type: "mcq", options: ["object","define","class","new"], correct_answer: "class", marks: 1, sort_order: 7 },
        { question: "Python function converting string to integer", question_type: "mcq", options: ["float()","str()","int()","char()"], correct_answer: "int()", marks: 1, sort_order: 8 },
        { question: "Output of: int x=10; System.out.println(++x);", question_type: "mcq", options: ["10","11","9","Error"], correct_answer: "11", marks: 1, sort_order: 9 },
        { question: "Java package imported automatically in every program", question_type: "mcq", options: ["java.io","java.util","java.lang","java.sql"], correct_answer: "java.lang", marks: 1, sort_order: 10 },
        { question: "Java keyword referring to the current object", question_type: "mcq", options: ["self","this","super","current"], correct_answer: "this", marks: 1, sort_order: 11 },
        { question: "Java keyword to prevent inheritance", question_type: "mcq", options: ["static","final","private","const"], correct_answer: "final", marks: 1, sort_order: 12 },
        { question: "SQL statement to create a database object", question_type: "mcq", options: ["CREATE","INSERT","UPDATE","SELECT"], correct_answer: "CREATE", marks: 1, sort_order: 13 },
        { question: "SQL clause that groups similar records", question_type: "mcq", options: ["GROUP BY","SORT BY","WHERE","HAVING"], correct_answer: "GROUP BY", marks: 1, sort_order: 14 },
        { question: "SQL function returning the highest value", question_type: "mcq", options: ["TOP()","MAX()","HIGH()","UPPER()"], correct_answer: "MAX()", marks: 1, sort_order: 15 },
        { question: "SQL command removing all rows but keeping the table structure", question_type: "mcq", options: ["DROP","DELETE","TRUNCATE","REMOVE"], correct_answer: "TRUNCATE", marks: 1, sort_order: 16 },
        { question: "Which is NOT a linear data structure?", question_type: "mcq", options: ["Array","Linked List","Queue","Tree"], correct_answer: "Tree", marks: 1, sort_order: 17 },
        { question: "Graph traversal technique that uses a queue", question_type: "mcq", options: ["DFS","BFS","Inorder","Postorder"], correct_answer: "BFS", marks: 1, sort_order: 18 },
        { question: "Fastest memory in a computer", question_type: "mcq", options: ["RAM","SSD","Cache","Hard Disk"], correct_answer: "Cache", marks: 1, sort_order: 19 },
        { question: "Protocol used to transfer files", question_type: "mcq", options: ["HTTP","FTP","SMTP","DNS"], correct_answer: "FTP", marks: 1, sort_order: 20 },
        // Part B — Fill in the Blanks
        { question: "The C++ operator used for dynamic memory allocation is ________.", question_type: "fill_blank", options: null, correct_answer: "new", marks: 1, sort_order: 21 },
        { question: "A function that does not return any value in C++ has return type ________.", question_type: "fill_blank", options: null, correct_answer: "void", marks: 1, sort_order: 22 },
        { question: "Python uses ________ to define code blocks instead of braces.", question_type: "fill_blank", options: null, correct_answer: "indentation", marks: 1, sort_order: 23 },
        { question: "The Python method used to add an element at the end of a list is ________.", question_type: "fill_blank", options: null, correct_answer: "append()", marks: 1, sort_order: 24 },
        { question: "Java programs are compiled into ________ before execution.", question_type: "fill_blank", options: null, correct_answer: "bytecode", marks: 1, sort_order: 25 },
        { question: "The keyword used to inherit a class in Java is ________.", question_type: "fill_blank", options: null, correct_answer: "extends", marks: 1, sort_order: 26 },
        { question: "The SQL function used to find the maximum value is ________.", question_type: "fill_blank", options: null, correct_answer: "MAX", marks: 1, sort_order: 27 },
        { question: "The SQL command to delete all records from a table while keeping its structure is ________.", question_type: "fill_blank", options: null, correct_answer: "TRUNCATE", marks: 1, sort_order: 28 },
        { question: "Binary Search has a time complexity of ________.", question_type: "fill_blank", options: null, correct_answer: "O(log n)", marks: 1, sort_order: 29 },
        { question: "The process of arranging data in ascending or descending order is called ________.", question_type: "fill_blank", options: null, correct_answer: "Sorting", marks: 1, sort_order: 30 },
      ]
    }
  ];

  // ──────────────────────────────────────────
  // STEP 3: Insert each section as a separate exam
  // ──────────────────────────────────────────
  for (const section of sections) {
    const { data: exam, error: examErr } = await supabase
      .from("exams")
      .insert({
        title: section.title,
        description: section.description,
        duration_minutes: 30,
        max_violations: 3,
        is_active: true,
      })
      .select()
      .single();

    if (examErr) { console.error("Error creating exam:", section.title, examErr); continue; }
    console.log(`Created: ${exam.title} (${exam.id})`);

    const questionsWithExam = section.questions.map(q => ({ ...q, exam_id: exam.id }));
    const { error: qErr } = await supabase.from("exam_questions").insert(questionsWithExam);
    if (qErr) { console.error("Error inserting questions for:", section.title, qErr); continue; }
    console.log(`  ✅ Inserted ${questionsWithExam.length} questions\n`);
  }

  console.log("🎉 All done! 3 exams created with 30 questions each.");
}

main();
