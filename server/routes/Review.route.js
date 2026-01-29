import express from "express";
import {
  HandleAddReview,
  HandleGetReviews,
} from "../controllers/Review.controller.js";
import { VerifyhHRToken } from "../middlewares/Auth.middleware.js";
import { RoleAuthorization } from "../middlewares/RoleAuth.middleware.js";

const router = express.Router();

// Add a new performance review
router.post(
  "/add",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleAddReview,
);

// Get all reviews for an employee
router.get(
  "/employee/:employeeId",
  VerifyhHRToken,
  RoleAuthorization("HR-Admin"),
  HandleGetReviews,
);

export default router;
