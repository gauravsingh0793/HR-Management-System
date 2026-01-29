import { Interviewinsight } from "../models/InterviewInsights.model.js";
import { sendInterviewScheduleEmail } from "../mailtrap/emails.js";
import { Employee } from "../models/Employee.model.js";

export const HandleCreateInterview = async (req, res) => {
  try {
    const { applicantName, applicantEmail, interviewerID, interviewDate } =
      req.body;

    if (!applicantName || !applicantEmail || !interviewerID) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Applicant name, email, and interviewer are required",
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicantEmail)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    // Get interviewer details
    const interviewer = await Employee.findById(interviewerID).select(
      "firstname lastname email"
    );
    if (!interviewer) {
      return res
        .status(404)
        .json({ success: false, message: "Interviewer not found" });
    }

    const newInterview = await Interviewinsight.create({
      applicantName,
      applicantEmail,
      interviewer: interviewerID,
      interviewdate: interviewDate ? new Date(interviewDate) : undefined,
      organizationID: req.ORGID,
    });

    // Send email notification to applicant
    try {
      console.log("Attempting to send interview email to:", applicantEmail);
      const emailResult = await sendInterviewScheduleEmail(
        applicantEmail,
        applicantName,
        `${interviewer.firstname} ${interviewer.lastname}`,
        interviewDate
          ? new Date(interviewDate).toLocaleString()
          : "To be confirmed"
      );
      console.log("Email send result:", emailResult);
      if (!emailResult) {
        console.warn("Email sending failed but interview was created");
      }
    } catch (emailError) {
      console.error("Failed to send interview email:", emailError);
      // Don't fail the whole request if email fails
    }

    return res
      .status(201)
      .json({
        success: true,
        message:
          "Interview scheduled successfully. Notification sent to applicant.",
        data: newInterview,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

// Bulk create interviews for multiple applicants at once
export const HandleCreateMultipleInterviews = async (req, res) => {
  try {
    const { interviews } = req.body;

    if (!Array.isArray(interviews) || interviews.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "'interviews' must be a non-empty array",
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const created = [];
    const failed = [];

    for (const item of interviews) {
      const { applicantName, applicantEmail, interviewerID, interviewDate } =
        item || {};

      // Basic validation
      if (!applicantName || !applicantEmail || !interviewerID) {
        failed.push({
          applicantName,
          applicantEmail,
          interviewerID,
          reason: "Applicant name, email, and interviewer are required",
        });
        continue;
      }

      if (!emailRegex.test(applicantEmail)) {
        failed.push({
          applicantName,
          applicantEmail,
          interviewerID,
          reason: "Invalid email format",
        });
        continue;
      }

      try {
        const interviewer = await Employee.findById(interviewerID).select(
          "firstname lastname email"
        );
        if (!interviewer) {
          failed.push({
            applicantName,
            applicantEmail,
            interviewerID,
            reason: "Interviewer not found",
          });
          continue;
        }

        const newInterview = await Interviewinsight.create({
          applicantName,
          applicantEmail,
          interviewer: interviewerID,
          interviewdate: interviewDate ? new Date(interviewDate) : undefined,
          organizationID: req.ORGID,
        });

        created.push(newInterview);

        // Fire email but don't fail whole bulk on error
        try {
          const emailResult = await sendInterviewScheduleEmail(
            applicantEmail,
            applicantName,
            `${interviewer.firstname} ${interviewer.lastname}`,
            interviewDate
              ? new Date(interviewDate).toLocaleString()
              : "To be confirmed"
          );
          if (!emailResult) {
            failed.push({
              applicantName,
              applicantEmail,
              interviewerID,
              reason: "Interview created but email sending failed",
            });
          }
        } catch (emailError) {
          console.error("Failed to send interview email (bulk):", emailError);
          failed.push({
            applicantName,
            applicantEmail,
            interviewerID,
            reason: "Interview created but email threw an error",
          });
        }
      } catch (innerError) {
        failed.push({
          applicantName,
          applicantEmail,
          interviewerID,
          reason:
            innerError.message || "Unexpected error while creating interview",
        });
      }
    }

    return res.status(207).json({
      success: created.length > 0,
      message: "Bulk interview scheduling completed",
      created,
      failed,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

export const HandleAllInterviews = async (req, res) => {
  try {
    const interviews = await Interviewinsight.find({
      organizationID: req.ORGID,
    }).populate("applicant interviewer", "firstname lastname email");
    return res
      .status(200)
      .json({
        success: true,
        message: "All Interview records Found Successfully",
        data: interviews,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

export const HandleInterview = async (req, res) => {
  try {
    const { interviewID } = req.params;
    const interview = await Interviewinsight.findOne({
      _id: interviewID,
      organizationID: req.ORGID,
    }).populate("applicant interviewer", "firstname lastname email");

    if (!interview) {
      return res
        .status(404)
        .json({ success: false, message: "Interview Record not found" });
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Interview Record retrieved successfully",
        data: interview,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

export const HandleUpdateInterview = async (req, res) => {
  try {
    const { interviewID, UpdatedData } = req.body;
    const interview = await Interviewinsight.findByIdAndUpdate(
      interviewID,
      UpdatedData,
      { new: true }
    );
    if (!interview) {
      return res
        .status(404)
        .json({ success: false, message: "Interview Record not found" });
    }
    return res
      .status(200)
      .json({
        success: true,
        message: "Interview Record updated successfully",
        data: interview,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

export const HandleDeleteInterview = async (req, res) => {
  try {
    const { interviewID } = req.params;
    const interview = await Interviewinsight.findByIdAndDelete(interviewID);
    if (!interview) {
      return res
        .status(404)
        .json({ success: false, message: "Interview Record not found" });
    }
    return res
      .status(200)
      .json({
        success: true,
        message: "Interview Record deleted successfully",
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};
