import { Employee } from "../models/Employee.model.js";
import { Task } from "../models/Task.model.js";
import { Review } from "../models/Review.model.js";
import { Attendance } from "../models/Attendance.model.js";

// Helper to ensure the requester is a Manager
const ensureManager = async (req, res) => {
  try {
    const manager = await Employee.findOne({
      _id: req.EMid,
      organizationID: req.ORGID,
      role: "Manager",
    });

    if (!manager) {
      return {
        ok: false,
        response: res.status(403).json({
          success: false,
          message: "Only managers can access this resource",
        }),
      };
    }

    return { ok: true, manager };
  } catch (error) {
    return {
      ok: false,
      response: res
        .status(500)
        .json({ success: false, message: "Internal server error", error }),
    };
  }
};

export const HandleManagerEmployees = async (req, res) => {
  const check = await ensureManager(req, res);
  if (!check.ok) return check.response;

  try {
    const employees = await Employee.find({ organizationID: req.ORGID })
      .populate("department", "name")
      .select("firstname lastname email department status");

    return res.status(200).json({
      success: true,
      data: employees,
      message: "Employees fetched successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error });
  }
};

export const HandleCreateTask = async (req, res) => {
  const check = await ensureManager(req, res);
  if (!check.ok) return check.response;

  try {
    const { employeeID, title, description, deadline, priority } = req.body;

    if (!employeeID || !title) {
      return res
        .status(400)
        .json({ success: false, message: "employeeID and title are required" });
    }

    const employee = await Employee.findOne({
      _id: employeeID,
      organizationID: req.ORGID,
    });

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    const task = await Task.create({
      title,
      description: description || "",
      employee: employee._id,
      createdBy: req.EMid,
      deadline: deadline ? new Date(deadline) : undefined,
      priority: priority || "Medium",
      organizationID: req.ORGID,
    });

    employee.tasks = employee.tasks || [];
    employee.tasks.push(task._id);
    await employee.save();

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error });
  }
};

export const HandleUpdateTaskStatus = async (req, res) => {
  const check = await ensureManager(req, res);
  if (!check.ok) return check.response;

  try {
    const { taskID, status } = req.body;

    if (!taskID || !status) {
      return res
        .status(400)
        .json({ success: false, message: "taskID and status are required" });
    }

    const allowedStatuses = ["Pending", "In Progress", "Completed", "Overdue"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const task = await Task.findOne({
      _id: taskID,
      organizationID: req.ORGID,
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const previousStatus = task.status;
    task.status = status;
    await task.save();

    // When a task is marked completed for the first time, automatically
    // create a lightweight performance review entry so dashboards update.
    if (status === "Completed" && previousStatus !== "Completed") {
      try {
        const employee = await Employee.findOne({
          _id: task.employee,
          organizationID: req.ORGID,
        }).select("_id reviews");

        if (employee) {
          const now = new Date();
          let deadlineAdherence = 3;
          if (task.deadline instanceof Date && !isNaN(task.deadline)) {
            deadlineAdherence = now <= task.deadline ? 5 : 2;
          }

          const review = await Review.create({
            employee: employee._id,
            createdBy: req.EMid,
            organizationID: req.ORGID,
            overallScore: 4,
            deadlineAdherence,
            performanceScore: 4,
            comments: `Task "${task.title}" marked completed.`,
          });

          employee.reviews = employee.reviews || [];
          employee.reviews.push(review._id);
          await employee.save();
        }
      } catch (err) {
        console.error(
          "Failed to create auto-review from task completion:",
          err,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: task,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error });
  }
};

export const HandleManagerTasksForEmployee = async (req, res) => {
  const check = await ensureManager(req, res);
  if (!check.ok) return check.response;

  try {
    const { employeeID } = req.params;

    const tasks = await Task.find({
      employee: employeeID,
      organizationID: req.ORGID,
    })
      .populate("employee", "firstname lastname email")
      .populate("createdBy", "firstname lastname email");

    return res.status(200).json({
      success: true,
      data: tasks,
      message: "Tasks fetched successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error });
  }
};

export const HandleCreateReview = async (req, res) => {
  const check = await ensureManager(req, res);
  if (!check.ok) return check.response;

  try {
    const { employeeID, softSkills, behavioral, communication, comments } =
      req.body;

    if (!employeeID) {
      return res.status(400).json({
        success: false,
        message: "employeeID is required",
      });
    }

    const employee = await Employee.findOne({
      _id: employeeID,
      organizationID: req.ORGID,
    });

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Auto-calculate performanceScore based on attendance and deadline adherence
    let performanceScore = 3; // default
    let attendanceScore = 3;
    let deadlineScore = 3;

    try {
      // Calculate attendance score (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendanceRecords = await Attendance.find({
        employee: employee._id,
        date: { $gte: thirtyDaysAgo },
      });

      if (attendanceRecords.length > 0) {
        const presentCount = attendanceRecords.filter(
          (a) => a.status === "Present" || a.status === "present",
        ).length;
        const totalDays = attendanceRecords.length;
        const attendanceRate = presentCount / totalDays;

        if (attendanceRate >= 0.95) attendanceScore = 5;
        else if (attendanceRate >= 0.85) attendanceScore = 4;
        else if (attendanceRate >= 0.75) attendanceScore = 3;
        else if (attendanceRate >= 0.65) attendanceScore = 2;
        else attendanceScore = 1;
      }
    } catch (err) {
      console.error("Error calculating attendance score:", err);
    }

    try {
      // Calculate deadline adherence score (last 10 completed tasks)
      const tasksWithDeadlines = await Task.find({
        employee: employee._id,
        organizationID: req.ORGID,
        status: "Completed",
        deadline: { $exists: true, $ne: null },
      })
        .sort({ updatedAt: -1 })
        .limit(10);

      if (tasksWithDeadlines.length > 0) {
        let onTimeCount = 0;
        tasksWithDeadlines.forEach((task) => {
          if (task.updatedAt && task.deadline) {
            if (new Date(task.updatedAt) <= new Date(task.deadline)) {
              onTimeCount++;
            }
          }
        });

        const onTimeRate = onTimeCount / tasksWithDeadlines.length;
        if (onTimeRate >= 0.9) deadlineScore = 5;
        else if (onTimeRate >= 0.7) deadlineScore = 4;
        else if (onTimeRate >= 0.5) deadlineScore = 3;
        else if (onTimeRate >= 0.3) deadlineScore = 2;
        else deadlineScore = 1;
      }
    } catch (err) {
      console.error("Error calculating deadline score:", err);
    }

    // Performance = average of attendance and deadline adherence
    performanceScore = (attendanceScore + deadlineScore) / 2;

    // Calculate overallScore as average of all scores
    const scores = [
      softSkills,
      behavioral,
      communication,
      performanceScore,
    ].filter((v) => typeof v === "number");
    const overallScore = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 3;

    const review = await Review.create({
      employee: employee._id,
      createdBy: req.EMid,
      softSkills,
      behavioral,
      communication,
      performanceScore,
      deadlineAdherence: deadlineScore, // Store for reference
      overallScore,
      comments: comments || "",
      organizationID: req.ORGID,
    });

    employee.reviews = employee.reviews || [];
    employee.reviews.push(review._id);
    await employee.save();

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error });
  }
};

export const HandleManagerReviewsForEmployee = async (req, res) => {
  const check = await ensureManager(req, res);
  if (!check.ok) return check.response;

  try {
    const { employeeID } = req.params;

    const reviews = await Review.find({
      employee: employeeID,
      organizationID: req.ORGID,
    })
      .populate("employee", "firstname lastname email")
      .populate("createdBy", "firstname lastname email");

    return res.status(200).json({
      success: true,
      data: reviews,
      message: "Reviews fetched successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error });
  }
};
