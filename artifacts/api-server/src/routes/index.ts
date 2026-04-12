import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentsRouter from "./students";
import examsRouter from "./exams";
import attemptsRouter from "./attempts";
import otpRouter from "./otp";

const router: IRouter = Router();

router.use(healthRouter);
router.use(otpRouter);
router.use(studentsRouter);
router.use(examsRouter);
router.use(attemptsRouter);

export default router;
