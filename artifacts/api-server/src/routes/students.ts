import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, studentsTable, attemptsTable, examsTable } from "@workspace/db";
import {
  GetStudentProfileQueryParams,
  CreateStudentProfileBody,
  GetStudentStatsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/students/profile", async (req, res): Promise<void> => {
  const params = GetStudentProfileQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.firebaseUid, params.data.uid));

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json({
    id: student.id,
    firebaseUid: student.firebaseUid,
    email: student.email,
    displayName: student.displayName,
    college: student.college,
    department: student.department,
    rollNumber: student.rollNumber,
    createdAt: student.createdAt.toISOString(),
  });
});

router.post("/students/profile", async (req, res): Promise<void> => {
  const parsed = CreateStudentProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.firebaseUid, parsed.data.firebaseUid));

  if (existing.length > 0) {
    const [updated] = await db
      .update(studentsTable)
      .set({
        email: parsed.data.email,
        displayName: parsed.data.displayName ?? null,
        college: parsed.data.college,
        department: parsed.data.department,
        rollNumber: parsed.data.rollNumber,
      })
      .where(eq(studentsTable.firebaseUid, parsed.data.firebaseUid))
      .returning();

    res.status(201).json({
      id: updated.id,
      firebaseUid: updated.firebaseUid,
      email: updated.email,
      displayName: updated.displayName,
      college: updated.college,
      department: updated.department,
      rollNumber: updated.rollNumber,
      createdAt: updated.createdAt.toISOString(),
    });
    return;
  }

  const [student] = await db
    .insert(studentsTable)
    .values({
      firebaseUid: parsed.data.firebaseUid,
      email: parsed.data.email,
      displayName: parsed.data.displayName ?? null,
      college: parsed.data.college,
      department: parsed.data.department,
      rollNumber: parsed.data.rollNumber,
    })
    .returning();

  res.status(201).json({
    id: student.id,
    firebaseUid: student.firebaseUid,
    email: student.email,
    displayName: student.displayName,
    college: student.college,
    department: student.department,
    rollNumber: student.rollNumber,
    createdAt: student.createdAt.toISOString(),
  });
});

router.get("/students/stats", async (req, res): Promise<void> => {
  const params = GetStudentStatsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.firebaseUid, params.data.uid));

  if (!student) {
    res.json({ totalAttempts: 0, averageScore: 0, highestScore: 0, totalViolations: 0, completedExams: 0 });
    return;
  }

  const attempts = await db
    .select()
    .from(attemptsTable)
    .where(eq(attemptsTable.studentId, student.id));

  const completed = attempts.filter((a) => a.status === "submitted");
  const scores = completed.map((a) => a.score ?? 0);
  const avgScore = scores.length > 0 ? scores.reduce((s, x) => s + x, 0) / scores.length : 0;
  const highest = scores.length > 0 ? Math.max(...scores) : 0;
  const totalViolations = attempts.reduce((s, a) => s + a.violationCount, 0);

  res.json({
    totalAttempts: attempts.length,
    averageScore: Math.round(avgScore * 10) / 10,
    highestScore: Math.round(highest * 10) / 10,
    totalViolations,
    completedExams: completed.length,
  });
});

export default router;
