import express from "express";
import {
  HandleInitializeAttendance,
  HandleAllAttendance,
  HandleAttendance,
  HandleMyAttendance,
  HandleUpdateAttendance,
  HandleDeleteAttendance,
  HandleBiometricPunch,
} from "../controllers/Attendance.controller.js";
import {
  VerifyEmployeeToken,
  VerifyhHRToken,
} from "../middlewares/Auth.middleware.js";
import { RoleAuthorization } from "../middlewares/RoleAuth.middleware.js";

const router = express.Router();

router.post("/initialize", VerifyEmployeeToken, HandleInitializeAttendance);

router.get(
  "/all",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleAllAttendance
);

router.get("/my", VerifyEmployeeToken, HandleMyAttendance);

router.get(
  "/:attendanceID",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleAttendance
);

router.patch("/update-attendance", VerifyEmployeeToken, HandleUpdateAttendance);

router.delete(
  "/delete-attendance/:attendanceID",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleDeleteAttendance
);

// Biometric device endpoint (protected by shared secret in controller)
router.post("/biometric-punch", HandleBiometricPunch);

export default router;
