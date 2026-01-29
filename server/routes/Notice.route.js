import express from "express";
import {
  HandleCreateNotice,
  HandleAllNotice,
  HandleEmployeeNotices,
  HandleNotice,
  HandleUpdateNotice,
  HandleDeleteNotice,
} from "../controllers/Notice.controller.js";
import {
  VerifyEmployeeToken,
  VerifyhHRToken,
} from "../middlewares/Auth.middleware.js";
import { RoleAuthorization } from "../middlewares/RoleAuth.middleware.js";

const router = express.Router();

router.post(
  "/create-notice",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleCreateNotice
);

router.get(
  "/all/",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleAllNotice
);

// Employee-facing: allow employees to read notices
router.get("/employee/all", VerifyEmployeeToken, HandleEmployeeNotices);

router.get(
  "/:noticeID",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleNotice
);

router.patch(
  "/update-notice",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleUpdateNotice
);

router.delete(
  "/delete-notice/:noticeID",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleDeleteNotice
);

export default router;
