import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, studentsTable, attemptsTable, answersTable, questionsTable, examsTable } from "@workspace/db";
import {
  StartAttemptBody,
  GetAttemptParams,
  SaveAnswerParams,
  SaveAnswerBody,
  SubmitAttemptParams,
  SubmitAttemptBody,
  LogViolationParams,
  LogViolationBody,
  ListAttemptsQueryParams,
} from "@workspace/api-zod";
import { gradeAttempt } from "../lib/grading";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/attempts", async (req, res): Promise<void> => {
  const params = ListAttemptsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.firebaseUid, params.data.uid));

  if (!student) {
    res.json([]);
    return;
  }

  const attempts = await db
    .select({
      id: attemptsTable.id,
      studentId: attemptsTable.studentId,
      examId: attemptsTable.examId,
      status: attemptsTable.status,
      startedAt: attemptsTable.startedAt,
      submittedAt: attemptsTable.submittedAt,
      score: attemptsTable.score,
      violationCount: attemptsTable.violationCount,
      examTitle: examsTable.title,
      examSubject: examsTable.subject,
      totalMarks: examsTable.totalMarks,
    })
    .from(attemptsTable)
    .leftJoin(examsTable, eq(attemptsTable.examId, examsTable.id))
    .where(eq(attemptsTable.studentId, student.id))
    .orderBy(attemptsTable.startedAt);

  res.json(attempts.map((a) => ({
    id: a.id,
    studentId: a.studentId,
    examId: a.examId,
    status: a.status,
    startedAt: a.startedAt.toISOString(),
    submittedAt: a.submittedAt?.toISOString() ?? null,
    score: a.score,
    violationCount: a.violationCount,
    examTitle: a.examTitle,
    examSubject: a.examSubject,
    totalMarks: a.totalMarks,
  })));
});

router.post("/attempts", async (req, res): Promise<void> => {
  const parsed = StartAttemptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.firebaseUid, parsed.data.firebaseUid));

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const existing = await db
    .select()
    .from(attemptsTable)
    .where(and(eq(attemptsTable.studentId, student.id), eq(attemptsTable.examId, parsed.data.examId)));

  if (existing.length > 0) {
    const a = existing[0];
    res.status(201).json({
      id: a.id,
      studentId: a.studentId,
      examId: a.examId,
      status: a.status,
      startedAt: a.startedAt.toISOString(),
      submittedAt: a.submittedAt?.toISOString() ?? null,
      score: a.score,
      violationCount: a.violationCount,
    });
    return;
  }

  const [attempt] = await db
    .insert(attemptsTable)
    .values({
      studentId: student.id,
      examId: parsed.data.examId,
      status: "in_progress",
      violationCount: 0,
    })
    .returning();

  res.status(201).json({
    id: attempt.id,
    studentId: attempt.studentId,
    examId: attempt.examId,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: null,
    score: null,
    violationCount: 0,
  });
});

router.get("/attempts/:id", async (req, res): Promise<void> => {
  const params = GetAttemptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [attempt] = await db
    .select()
    .from(attemptsTable)
    .where(eq(attemptsTable.id, params.data.id));

  if (!attempt) {
    res.status(404).json({ error: "Attempt not found" });
    return;
  }

  const answers = await db
    .select()
    .from(answersTable)
    .where(eq(answersTable.attemptId, attempt.id));

  res.json({
    id: attempt.id,
    studentId: attempt.studentId,
    examId: attempt.examId,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    score: attempt.score,
    violationCount: attempt.violationCount,
    answers: answers.map((a) => ({
      id: a.id,
      attemptId: a.attemptId,
      questionId: a.questionId,
      answerText: a.answerText,
      isCorrect: a.isCorrect,
      marksAwarded: a.marksAwarded,
    })),
  });
});

router.post("/attempts/:id/save-answer", async (req, res): Promise<void> => {
  const pathParams = SaveAnswerParams.safeParse(req.params);
  if (!pathParams.success) {
    res.status(400).json({ error: pathParams.error.message });
    return;
  }

  const body = SaveAnswerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(answersTable)
    .where(and(eq(answersTable.attemptId, pathParams.data.id), eq(answersTable.questionId, body.data.questionId)));

  let answer;
  if (existing.length > 0) {
    const [updated] = await db
      .update(answersTable)
      .set({ answerText: body.data.answerText })
      .where(and(eq(answersTable.attemptId, pathParams.data.id), eq(answersTable.questionId, body.data.questionId)))
      .returning();
    answer = updated;
  } else {
    const [inserted] = await db
      .insert(answersTable)
      .values({
        attemptId: pathParams.data.id,
        questionId: body.data.questionId,
        answerText: body.data.answerText,
      })
      .returning();
    answer = inserted;
  }

  res.json({
    id: answer.id,
    attemptId: answer.attemptId,
    questionId: answer.questionId,
    answerText: answer.answerText,
    isCorrect: answer.isCorrect,
    marksAwarded: answer.marksAwarded,
  });
});

router.post("/attempts/:id/submit", async (req, res): Promise<void> => {
  const pathParams = SubmitAttemptParams.safeParse(req.params);
  if (!pathParams.success) {
    res.status(400).json({ error: pathParams.error.message });
    return;
  }

  const body = SubmitAttemptBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [attempt] = await db
    .select()
    .from(attemptsTable)
    .where(eq(attemptsTable.id, pathParams.data.id));

  if (!attempt) {
    res.status(404).json({ error: "Attempt not found" });
    return;
  }

  const [exam] = await db
    .select()
    .from(examsTable)
    .where(eq(examsTable.id, attempt.examId));

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.examId, attempt.examId));

  const answers = await db
    .select()
    .from(answersTable)
    .where(eq(answersTable.attemptId, attempt.id));

  try {
    const gradingResult = await gradeAttempt(questions, answers);

    const totalScore = gradingResult.reduce((sum, g) => sum + g.marksAwarded, 0);

    for (const detail of gradingResult) {
      await db
        .update(answersTable)
        .set({
          isCorrect: detail.isCorrect,
          marksAwarded: detail.marksAwarded,
          aiFeedback: detail.aiFeedback ?? null,
        })
        .where(and(eq(answersTable.attemptId, attempt.id), eq(answersTable.questionId, detail.questionId)));
    }

    const [updatedAttempt] = await db
      .update(attemptsTable)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        score: totalScore,
        timeTakenSeconds: body.data.timeTakenSeconds,
      })
      .where(eq(attemptsTable.id, attempt.id))
      .returning();

    res.json({
      attemptId: updatedAttempt.id,
      score: totalScore,
      totalMarks: exam.totalMarks,
      percentage: Math.round((totalScore / exam.totalMarks) * 1000) / 10,
      violationCount: updatedAttempt.violationCount,
      status: updatedAttempt.status,
      gradingDetails: gradingResult,
    });
  } catch (err) {
    logger.error({ err }, "Grading failed");
    res.status(500).json({ error: "Grading failed" });
  }
});

router.post("/attempts/:id/violation", async (req, res): Promise<void> => {
  const pathParams = LogViolationParams.safeParse(req.params);
  if (!pathParams.success) {
    res.status(400).json({ error: pathParams.error.message });
    return;
  }

  const body = LogViolationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [attempt] = await db
    .select()
    .from(attemptsTable)
    .where(eq(attemptsTable.id, pathParams.data.id));

  if (!attempt) {
    res.status(404).json({ error: "Attempt not found" });
    return;
  }

  const [exam] = await db
    .select()
    .from(examsTable)
    .where(eq(examsTable.id, attempt.examId));

  const newCount = attempt.violationCount + 1;
  const shouldTerminate = newCount >= exam.violationLimit;

  await db
    .update(attemptsTable)
    .set({
      violationCount: newCount,
      ...(shouldTerminate ? { status: "security_fail", submittedAt: new Date() } : {}),
    })
    .where(eq(attemptsTable.id, attempt.id));

  res.json({ violationCount: newCount, shouldTerminate });
});

export default router;
