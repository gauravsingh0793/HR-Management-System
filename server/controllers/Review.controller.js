import { Review } from "../models/Review.model.js";

// Add a new performance review
export const HandleAddReview = async (req, res) => {
  try {
    const {
      employee,
      softSkills,
      behavioral,
      communication,
      performance,
      deadlineAdherence,
      comments,
    } = req.body;
    if (!employee) {
      return res
        .status(400)
        .json({ success: false, message: "Employee is required" });
    }
    // Calculate overallScore as average of all provided scores
    const scores = [
      softSkills,
      behavioral,
      communication,
      performance,
      deadlineAdherence,
    ].filter((v) => typeof v === "number");
    const overallScore = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;
    const review = await Review.create({
      employee,
      createdBy: req.user._id, // assuming req.user is set by auth middleware
      softSkills,
      behavioral,
      communication,
      performanceScore: performance,
      deadlineAdherence,
      overallScore,
      comments,
      organizationID: req.ORGID,
    });
    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error });
  }
};

// Get all reviews for an employee
export const HandleGetReviews = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const reviews = await Review.find({ employee: employeeId });
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error });
  }
};
