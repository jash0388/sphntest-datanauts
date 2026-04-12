import { ai } from "@workspace/integrations-gemini-ai";
import { logger } from "./logger";

interface Question {
  id: number;
  questionType: string;
  correctAnswer: string | null;
  marks: number;
  rubric: string | null;
  questionText: string;
}

interface Answer {
  questionId: number;
  answerText: string | null;
}

interface GradingDetail {
  questionId: number;
  marksAwarded: number;
  maxMarks: number;
  isCorrect: boolean | null;
  aiFeedback: string | null;
}

export async function gradeAttempt(questions: Question[], answers: Answer[]): Promise<GradingDetail[]> {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answerText]));
  const results: GradingDetail[] = [];

  for (const q of questions) {
    const studentAnswer = answerMap.get(q.id) ?? null;

    if (q.questionType === "mcq") {
      const isCorrect = studentAnswer !== null && q.correctAnswer !== null
        ? studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
        : false;

      results.push({
        questionId: q.id,
        marksAwarded: isCorrect ? q.marks : 0,
        maxMarks: q.marks,
        isCorrect,
        aiFeedback: null,
      });
    } else {
      if (!studentAnswer || studentAnswer.trim() === "") {
        results.push({
          questionId: q.id,
          marksAwarded: 0,
          maxMarks: q.marks,
          isCorrect: null,
          aiFeedback: "No answer provided.",
        });
        continue;
      }

      try {
        const rubricText = q.rubric ? `Rubric: ${q.rubric}` : "Grade based on relevance, accuracy, and depth.";
        const prompt = `You are an academic examiner. Grade the following student answer.

Question: ${q.questionText}
Maximum Marks: ${q.marks}
${rubricText}

Student Answer: ${studentAnswer}

Respond in JSON format ONLY with no markdown:
{
  "marksAwarded": <number between 0 and ${q.marks}>,
  "feedback": "<brief 1-2 sentence feedback>"
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { maxOutputTokens: 8192 },
        });

        const text = response.text ?? "{}";
        const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        const awarded = Math.min(Math.max(parsed.marksAwarded ?? 0, 0), q.marks);

        results.push({
          questionId: q.id,
          marksAwarded: awarded,
          maxMarks: q.marks,
          isCorrect: null,
          aiFeedback: parsed.feedback ?? null,
        });
      } catch (err) {
        logger.error({ err, questionId: q.id }, "AI grading failed for question");
        results.push({
          questionId: q.id,
          marksAwarded: 0,
          maxMarks: q.marks,
          isCorrect: null,
          aiFeedback: "Grading error — please contact your instructor.",
        });
      }
    }
  }

  return results;
}
