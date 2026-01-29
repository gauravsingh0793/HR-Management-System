import express from "express";
import {
  HandleAllInterviews,
  HandleCreateInterview,
  HandleInterview,
  HandleUpdateInterview,
  HandleDeleteInterview,
  HandleCreateMultipleInterviews,
} from "../controllers/InterviewInsights.controller.js";
import { VerifyhHRToken } from "../middlewares/Auth.middleware.js";
import { RoleAuthorization } from "../middlewares/RoleAuth.middleware.js";

const router = express.Router();

router.post(
  "/create-interview",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleCreateInterview
);

// Bulk create multiple interviews in one request
router.post(
  "/create-interview/bulk",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleCreateMultipleInterviews
);

router.get(
  "/all",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleAllInterviews
);

router.get(
  "/:interviewID",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleInterview
);

router.patch(
  "/update-interview",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleUpdateInterview
);

router.delete(
  "/delete-interview/:interviewID",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleDeleteInterview
);

export default router;
