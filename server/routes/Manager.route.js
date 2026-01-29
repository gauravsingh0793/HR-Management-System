import express from "express";
import { VerifyEmployeeToken } from "../middlewares/Auth.middleware.js";
import {
  HandleManagerEmployees,
  HandleCreateTask,
  HandleUpdateTaskStatus,
  HandleManagerTasksForEmployee,
  HandleCreateReview,
  HandleManagerReviewsForEmployee,
} from "../controllers/Manager.controller.js";

const router = express.Router();

// All manager routes require an authenticated employee token
router.get("/employees", VerifyEmployeeToken, HandleManagerEmployees);

router.post("/tasks", VerifyEmployeeToken, HandleCreateTask);

router.patch("/tasks/status", VerifyEmployeeToken, HandleUpdateTaskStatus);

router.get(
  "/tasks/:employeeID",
  VerifyEmployeeToken,
  HandleManagerTasksForEmployee
);

router.post("/reviews", VerifyEmployeeToken, HandleCreateReview);

router.get(
  "/reviews/:employeeID",
  VerifyEmployeeToken,
  HandleManagerReviewsForEmployee
);

export default router;
