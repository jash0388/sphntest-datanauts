import { Router, type IRouter } from "express";
import { eq, notInArray } from "drizzle-orm";
import { db, examsTable, questionsTable, attemptsTable, studentsTable } from "@workspace/db";
import {
  CreateExamBody,
  GetExamParams,
  GetAvailableExamsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/exams/available", async (req, res): Promise<void> => {
  const params = GetAvailableExamsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.firebaseUid, params.data.uid));

  if (!student) {
    const allExams = await db.select().from(examsTable).orderBy(examsTable.createdAt);
    res.json(allExams.map(formatExam));
    return;
  }

  const attempts = await db
    .select({ examId: attemptsTable.examId })
    .from(attemptsTable)
    .where(eq(attemptsTable.studentId, student.id));

  const attemptedIds = attempts.map((a) => a.examId);

  const available =
    attemptedIds.length > 0
      ? await db
          .select()
          .from(examsTable)
          .where(notInArray(examsTable.id, attemptedIds))
          .orderBy(examsTable.createdAt)
      : await db.select().from(examsTable).orderBy(examsTable.createdAt);

  res.json(available.map(formatExam));
});

router.get("/exams", async (_req, res): Promise<void> => {
  const exams = await db.select().from(examsTable).orderBy(examsTable.createdAt);
  res.json(exams.map(formatExam));
});

router.get("/exams/:id", async (req, res): Promise<void> => {
  const params = GetExamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [exam] = await db
    .select()
    .from(examsTable)
    .where(eq(examsTable.id, params.data.id));

  if (!exam) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.examId, exam.id))
    .orderBy(questionsTable.orderIndex);

  res.json({
    ...formatExam(exam),
    questions: questions.map(formatQuestion),
  });
});

router.post("/exams", async (req, res): Promise<void> => {
  const parsed = CreateExamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { questions: questionsData, ...examData } = parsed.data;

  const [exam] = await db.insert(examsTable).values(examData).returning();

  if (questionsData && questionsData.length > 0) {
    await db.insert(questionsTable).values(
      questionsData.map((q) => ({
        examId: exam.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options ?? null,
        correctAnswer: q.correctAnswer ?? null,
        marks: q.marks,
        rubric: q.rubric ?? null,
        orderIndex: q.orderIndex,
      }))
    );
  }

  res.status(201).json(formatExam(exam));
});

function formatExam(exam: { id: number; title: string; description: string | null; subject: string; durationMinutes: number; totalMarks: number; violationLimit: number; createdAt: Date }) {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    subject: exam.subject,
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    violationLimit: exam.violationLimit,
    createdAt: exam.createdAt.toISOString(),
  };
}

function formatQuestion(q: { id: number; examId: number; questionText: string; questionType: string; options: string[] | null; correctAnswer: string | null; marks: number; rubric: string | null; orderIndex: number }) {
  return {
    id: q.id,
    examId: q.examId,
    questionText: q.questionText,
    questionType: q.questionType,
    options: q.options,
    correctAnswer: q.correctAnswer,
    marks: q.marks,
    rubric: q.rubric,
    orderIndex: q.orderIndex,
  };
}

export default router;
