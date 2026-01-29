import express from "express";
import {
  HandleAllEmployees,
  HandleEmployeeUpdate,
  HandleEmployeeDelete,
  HandleEmployeeByHR,
  HandleEmployeeByEmployee,
  HandleAllEmployeesIDS,
  HandleEmployeeUpdateByHR,
  HandleEmployeeMyTasks,
  HandleEmployeeAddTaskComment,
  HandleEmployeeMyPerformance,
} from "../controllers/Employee.controller.js";
import { VerifyhHRToken } from "../middlewares/Auth.middleware.js";
import { RoleAuthorization } from "../middlewares/RoleAuth.middleware.js";
import { VerifyEmployeeToken } from "../middlewares/Auth.middleware.js";

const router = express.Router();

router.get(
  "/all",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleAllEmployees
);

router.get(
  "/all-employees-ids",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleAllEmployeesIDS
);

router.patch("/update-employee", VerifyEmployeeToken, HandleEmployeeUpdate);

// HR-only update for employee profile and status
router.patch(
  "/update-employee-by-HR",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleEmployeeUpdateByHR
);

router.delete(
  "/delete-employee/:employeeId",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleEmployeeDelete
);

router.get(
  "/by-HR/:employeeId",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleEmployeeByHR
);

router.get("/by-employee", VerifyEmployeeToken, HandleEmployeeByEmployee);

// Employee tasks & comments
router.get("/tasks/my", VerifyEmployeeToken, HandleEmployeeMyTasks);
router.post(
  "/tasks/comment",
  VerifyEmployeeToken,
  HandleEmployeeAddTaskComment
);

// Employee performance (self-view)
router.get("/performance/my", VerifyEmployeeToken, HandleEmployeeMyPerformance);

export default router;
