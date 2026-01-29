import { Department } from "../models/Department.model.js";
import { Employee } from "../models/Employee.model.js";
import { Organization } from "../models/Organization.model.js";
import { Attendance } from "../models/Attendance.model.js";
import { Review } from "../models/Review.model.js";
import { Task } from "../models/Task.model.js";

export const HandleAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ organizationID: req.ORGID })
      .populate("department", "name")
      .select(
        "firstname lastname email contactnumber department attendance notice salary leaverequest generaterequest isverified status dateOfBirth role",
      );

    // Get today's date at midnight UTC for comparison
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Fetch attendance records for all employees
    const employeeIds = employees.map((emp) => emp._id);
    const attendanceRecords = await Attendance.find({
      employee: { $in: employeeIds },
      organizationID: req.ORGID,
    }).select("employee status attendancelog");

    // Create maps for attendance status (today), check-in/out times, and attendance-based score
    const attendanceMap = {};
    const checkInMap = {};
    const checkOutMap = {};
    const attendanceScoreMap = {};

    attendanceRecords.forEach((record) => {
      const idStr = record.employee.toString();

      // Status for today
      const todayLog = record.attendancelog.find((log) => {
        const logDate = new Date(log.logdate);
        logDate.setUTCHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
      });

      if (todayLog) {
        attendanceMap[idStr] = todayLog.logstatus;
        checkInMap[idStr] = todayLog.checkInTime;
        checkOutMap[idStr] = todayLog.checkOutTime;
      } else {
        attendanceMap[idStr] = record.status || "Not Specified";
        checkInMap[idStr] = null;
        checkOutMap[idStr] = null;
      }

      // Attendance performance over all logs: present ratio mapped to 1-5
      if (record.attendancelog && record.attendancelog.length > 0) {
        let presentDays = 0;
        let totalDays = 0;
        record.attendancelog.forEach((log) => {
          if (!log.logstatus) return;
          const normalized = String(log.logstatus).toLowerCase();
          if (["present", "absent", "not specified"].includes(normalized)) {
            totalDays += 1;
            if (normalized === "present") {
              presentDays += 1;
            }
          }
        });
        if (totalDays > 0) {
          const ratio = presentDays / totalDays; // 0-1
          const score = 1 + ratio * 4; // map to 1-5
          attendanceScoreMap[idStr] = Number(score.toFixed(2));
        }
      }
    });

    // Fetch all performance reviews for this organization, including deadline and manager scores
    const reviews = await Review.find({ organizationID: req.ORGID }).select(
      "employee overallScore deadlineAdherence performanceScore createdAt",
    );

    const performanceMap = {};
    reviews.forEach((rev) => {
      const key = rev.employee.toString();
      if (!performanceMap[key]) {
        performanceMap[key] = {
          overallSum: 0,
          overallCount: 0,
          deadlineSum: 0,
          deadlineCount: 0,
          perfSum: 0,
          perfCount: 0,
        };
      }

      if (typeof rev.overallScore === "number") {
        performanceMap[key].overallSum += rev.overallScore;
        performanceMap[key].overallCount += 1;
      }

      if (typeof rev.deadlineAdherence === "number") {
        performanceMap[key].deadlineSum += rev.deadlineAdherence;
        performanceMap[key].deadlineCount += 1;
      }

      if (typeof rev.performanceScore === "number") {
        performanceMap[key].perfSum += rev.performanceScore;
        performanceMap[key].perfCount += 1;
      }
    });

    // Calculate monthly performance for all employees (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyReviewsPromises = employees.map((emp) =>
      Review.find({
        employee: emp._id,
        organizationID: req.ORGID,
        createdAt: { $gte: thirtyDaysAgo },
      }).select("overallScore"),
    );

    const monthlyReviewsResults = await Promise.all(monthlyReviewsPromises);
    const monthlyPerformanceMap = {};

    monthlyReviewsResults.forEach((reviews, index) => {
      const empId = employees[index]._id.toString();
      if (reviews.length > 0) {
        const sum = reviews.reduce(
          (acc, rev) => acc + (rev.overallScore || 0),
          0,
        );
        monthlyPerformanceMap[empId] = Number(
          (sum / reviews.length).toFixed(2),
        );
      } else {
        monthlyPerformanceMap[empId] = null;
      }
    });

    // Add attendance status and composite performance score to each employee
    const employeesWithAttendance = employees.map((emp) => {
      const empObj = emp.toObject();
      const idStr = emp._id.toString();
      const attendanceStatus = attendanceMap[idStr] || "Not Specified";

      // Expose today's attendance separately; keep core employee status as-is
      empObj.attendanceStatus = attendanceStatus;
      empObj.checkInTime = checkInMap[idStr] || null;
      empObj.checkOutTime = checkOutMap[idStr] || null;

      const perf = performanceMap[idStr];
      const attendanceScore = attendanceScoreMap[idStr] ?? null;

      let reviewScore = null;
      let deadlineScore = null;
      let managerPerfScore = null;

      if (perf) {
        if (perf.overallCount > 0) {
          reviewScore = perf.overallSum / perf.overallCount;
        }
        if (perf.deadlineCount > 0) {
          deadlineScore = perf.deadlineSum / perf.deadlineCount;
        }
        if (perf.perfCount > 0) {
          managerPerfScore = perf.perfSum / perf.perfCount;
        }
      }

      // If no explicit overallScore but we have manager performanceScore, use it
      if (!reviewScore && managerPerfScore) {
        reviewScore = managerPerfScore;
      }

      // Build weighted composite from attendance, deadlines, and manager reviews
      const components = [];
      if (typeof reviewScore === "number") {
        components.push({ score: reviewScore, weight: 0.4 });
      }
      if (typeof deadlineScore === "number") {
        components.push({ score: deadlineScore, weight: 0.3 });
      }
      if (typeof attendanceScore === "number") {
        components.push({ score: attendanceScore, weight: 0.3 });
      }

      if (components.length > 0) {
        const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
        const combined =
          components.reduce((sum, c) => sum + c.score * c.weight, 0) /
          (totalWeight || 1);
        empObj.performanceScore = Number(combined.toFixed(2));
      } else {
        empObj.performanceScore = null;
      }

      empObj.reviewCount = perf ? perf.overallCount || perf.perfCount || 0 : 0;
      empObj.monthlyPerformance = monthlyPerformanceMap[idStr];

      return empObj;
    });

    return res.status(200).json({
      success: true,
      data: employeesWithAttendance,
      type: "AllEmployees",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: error, message: "internal server error" });
  }
};

// Employee: composite performance (attendance + deadlines + reviews) with monthly trend
export const HandleEmployeeMyPerformance = async (req, res) => {
  try {
    const employeeId = req.EMid;

    // Attendance record
    const attendance = await Attendance.findOne({
      employee: employeeId,
      organizationID: req.ORGID,
    }).select("attendancelog");

    const logs = Array.isArray(attendance?.attendancelog)
      ? attendance.attendancelog
      : [];

    // All-time attendance score
    let attendanceScore = null;
    if (logs.length) {
      let presentDays = 0;
      let totalDays = 0;
      logs.forEach((log) => {
        if (!log?.logstatus) return;
        const normalized = String(log.logstatus).toLowerCase();
        if (["present", "absent", "not specified"].includes(normalized)) {
          totalDays += 1;
          if (normalized === "present") presentDays += 1;
        }
      });
      if (totalDays > 0) {
        const ratio = presentDays / totalDays;
        attendanceScore = Number((1 + ratio * 4).toFixed(2));
      }
    }

    // All reviews for this employee
    const reviews = await Review.find({
      organizationID: req.ORGID,
      employee: employeeId,
    }).select("overallScore deadlineAdherence performanceScore createdAt");

    let overallSum = 0;
    let overallCount = 0;
    let deadlineSum = 0;
    let deadlineCount = 0;
    let perfSum = 0;
    let perfCount = 0;

    reviews.forEach((rev) => {
      if (typeof rev.overallScore === "number") {
        overallSum += rev.overallScore;
        overallCount += 1;
      }
      if (typeof rev.deadlineAdherence === "number") {
        deadlineSum += rev.deadlineAdherence;
        deadlineCount += 1;
      }
      if (typeof rev.performanceScore === "number") {
        perfSum += rev.performanceScore;
        perfCount += 1;
      }
    });

    let reviewScore = null;
    let deadlineScore = null;
    let managerPerfScore = null;

    if (overallCount > 0) {
      reviewScore = overallSum / overallCount;
    }
    if (deadlineCount > 0) {
      deadlineScore = deadlineSum / deadlineCount;
    }
    if (perfCount > 0) {
      managerPerfScore = perfSum / perfCount;
    }

    if (!reviewScore && managerPerfScore) {
      reviewScore = managerPerfScore;
    }

    const components = [];
    if (typeof reviewScore === "number") {
      components.push({ score: reviewScore, weight: 0.4 });
    }
    if (typeof deadlineScore === "number") {
      components.push({ score: deadlineScore, weight: 0.3 });
    }
    if (typeof attendanceScore === "number") {
      components.push({ score: attendanceScore, weight: 0.3 });
    }

    let compositeScore = null;
    if (components.length > 0) {
      const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
      const combined =
        components.reduce((sum, c) => sum + c.score * c.weight, 0) /
        (totalWeight || 1);
      compositeScore = Number(combined.toFixed(2));
    }

    const toPercent = (score) => {
      if (typeof score !== "number") return null;
      const normalized = ((score - 1) / 4) * 100;
      return Math.round(Math.min(Math.max(normalized, 0), 100));
    };

    // Monthly trend for last 6 months
    const now = new Date();
    const monthlyTrend = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthName = monthStart.toLocaleString("en-US", {
        month: "short",
      });

      // Attendance for this month
      let mPresent = 0;
      let mTotal = 0;
      logs.forEach((log) => {
        if (!log?.logdate || !log.logstatus) return;
        const d = new Date(log.logdate);
        if (d >= monthStart && d < monthEnd) {
          const normalized = String(log.logstatus).toLowerCase();
          if (["present", "absent", "not specified"].includes(normalized)) {
            mTotal += 1;
            if (normalized === "present") mPresent += 1;
          }
        }
      });
      const mAttendanceScore =
        mTotal > 0 ? Number((1 + (mPresent / mTotal) * 4).toFixed(2)) : null;

      // Reviews for this month
      let mOverallSum = 0;
      let mOverallCount = 0;
      let mDeadlineSum = 0;
      let mDeadlineCount = 0;
      let mPerfSum = 0;
      let mPerfCount = 0;

      reviews.forEach((rev) => {
        const created = new Date(rev.createdAt);
        if (created < monthStart || created >= monthEnd) return;

        if (typeof rev.overallScore === "number") {
          mOverallSum += rev.overallScore;
          mOverallCount += 1;
        }
        if (typeof rev.deadlineAdherence === "number") {
          mDeadlineSum += rev.deadlineAdherence;
          mDeadlineCount += 1;
        }
        if (typeof rev.performanceScore === "number") {
          mPerfSum += rev.performanceScore;
          mPerfCount += 1;
        }
      });

      let mReviewScore = null;
      let mDeadlineScore = null;
      let mManagerPerfScore = null;

      if (mOverallCount > 0) {
        mReviewScore = mOverallSum / mOverallCount;
      }
      if (mDeadlineCount > 0) {
        mDeadlineScore = mDeadlineSum / mDeadlineCount;
      }
      if (mPerfCount > 0) {
        mManagerPerfScore = mPerfSum / mPerfCount;
      }
      if (!mReviewScore && mManagerPerfScore) {
        mReviewScore = mManagerPerfScore;
      }

      const mComponents = [];
      if (typeof mReviewScore === "number") {
        mComponents.push({ score: mReviewScore, weight: 0.4 });
      }
      if (typeof mDeadlineScore === "number") {
        mComponents.push({ score: mDeadlineScore, weight: 0.3 });
      }
      if (typeof mAttendanceScore === "number") {
        mComponents.push({ score: mAttendanceScore, weight: 0.3 });
      }

      let mComposite = null;
      if (mComponents.length > 0) {
        const mTotalWeight = mComponents.reduce((sum, c) => sum + c.weight, 0);
        const mCombined =
          mComponents.reduce((sum, c) => sum + c.score * c.weight, 0) /
          (mTotalWeight || 1);
        mComposite = Number(mCombined.toFixed(2));
      }

      monthlyTrend.push({
        month: monthName,
        rawScore: mComposite,
        percent: toPercent(mComposite),
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        rawScore: compositeScore,
        percent: toPercent(compositeScore),
        components: {
          reviewScore,
          deadlineScore,
          attendanceScore,
        },
        monthlyTrend,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};

export const HandleAllEmployeesIDS = async (req, res) => {
  try {
    const employees = await Employee.find({ organizationID: req.ORGID })
      .populate("department", "name")
      .select("firstname lastname department");
    return res
      .status(200)
      .json({ success: true, data: employees, type: "AllEmployeesIDS" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: error, message: "internal server error" });
  }
};

export const HandleEmployeeByHR = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findOne({
      _id: employeeId,
      organizationID: req.ORGID,
    }).select(
      "firstname lastname email contactnumber department attendance notice salary leaverequest generaterequest status dateOfBirth role",
    );

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "employee not found" });
    }

    return res
      .status(200)
      .json({ success: true, data: employee, type: "GetEmployee" });
  } catch (error) {
    return res
      .status(404)
      .json({ success: false, error: error, message: "employee not found" });
  }
};

export const HandleEmployeeByEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.EMid,
      organizationID: req.ORGID,
    })
      .populate("department", "name")
      .select(
        "firstname lastname email contactnumber department attendance notice salary leaverequest generaterequest status isverified profileimage dateOfBirth role",
      );

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "employee not found" });
    }

    return res.json({
      success: true,
      message: "Employee Data Fetched Successfully",
      data: employee,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

// Employee: list own tasks with manager info and comments
export const HandleEmployeeMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      employee: req.EMid,
      organizationID: req.ORGID,
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "firstname lastname email role")
      .populate("comments.sender", "firstname lastname email role");

    return res.status(200).json({
      success: true,
      data: tasks,
      message: "Tasks fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

// Employee or Manager: add a comment to a task they are part of
export const HandleEmployeeAddTaskComment = async (req, res) => {
  try {
    const { taskID, message } = req.body;

    if (!taskID || !message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: "taskID and non-empty message are required",
      });
    }

    const employee = await Employee.findOne({
      _id: req.EMid,
      organizationID: req.ORGID,
    }).select("role");

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    const task = await Task.findOne({
      _id: taskID,
      organizationID: req.ORGID,
      $or: [{ employee: req.EMid }, { createdBy: req.EMid }],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or access denied",
      });
    }

    const comment = {
      sender: req.EMid,
      senderRole: employee.role === "Manager" ? "Manager" : "Employee",
      message: String(message).trim(),
      createdAt: new Date(),
    };

    task.comments = task.comments || [];
    task.comments.push(comment);
    await task.save();

    await task
      .populate("createdBy", "firstname lastname email role")
      .populate("comments.sender", "firstname lastname email role");

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

export const HandleEmployeeUpdate = async (req, res) => {
  try {
    const { employeeId, updatedEmployee } = req.body;

    const checkeemployee = await Employee.findById(employeeId);

    if (!checkeemployee) {
      return res
        .status(404)
        .json({ success: false, message: "employee not found" });
    }

    const payload = { ...updatedEmployee };

    console.log("Received updatedEmployee:", updatedEmployee);
    console.log("Has profileimage in payload?", !!payload.profileimage);
    console.log("profileimage length:", payload.profileimage?.length);

    // Handle profile image upload if present
    if (payload.profileimage && !payload.profileimage.startsWith("http")) {
      try {
        console.log("Attempting to upload Employee profile image...");
        console.log("Image data URI length:", payload.profileimage?.length);
        const { uploadImage } = await import("../utils/cloudinary.js");
        const url = await uploadImage(
          payload.profileimage,
          "hr-nexus/employees",
        );
        if (url) {
          payload.profileimage = url;
          console.log("Employee profile image uploaded successfully:", url);
        } else {
          console.error("Image upload returned no URL");
          return res.status(400).json({
            success: false,
            message: "Image upload returned no URL",
          });
        }
      } catch (err) {
        console.error("Employee Image upload error:", err);
        return res.status(400).json({
          success: false,
          message: "Image upload failed",
          error: err?.message || String(err),
        });
      }
    }

    console.log("Updating employee with payload keys:", Object.keys(payload));
    console.log(
      "payload.profileimage:",
      payload.profileimage ? "EXISTS" : "MISSING",
    );

    // Update the employee first
    await Employee.findByIdAndUpdate(employeeId, payload, {
      new: true,
    });

    // Then fetch with populate to ensure all fields are returned correctly
    const employee = await Employee.findById(employeeId)
      .populate("department", "name")
      .select(
        "firstname lastname email contactnumber department status profileimage dateOfBirth",
      );

    console.log(
      "Updated employee data keys:",
      Object.keys(employee?.toObject() || {}),
    );
    console.log(
      "Updated employee profileimage:",
      employee?.profileimage || "UNDEFINED",
    );
    console.log("Updated employee department:", employee?.department);

    return res.status(200).json({ success: true, data: employee });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: error, message: "internal server error" });
  }
};

// HR-only update for employee details and status
export const HandleEmployeeUpdateByHR = async (req, res) => {
  try {
    const { employeeId, updatedEmployee } = req.body;

    if (!employeeId || !updatedEmployee) {
      return res.status(400).json({
        success: false,
        message: "Missing employeeId or updatedEmployee",
      });
    }

    const existing = await Employee.findOne({
      _id: employeeId,
      organizationID: req.ORGID,
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "employee not found" });
    }

    // Whitelist fields HR is allowed to change
    const allowed = {};
    if (typeof updatedEmployee.firstname === "string")
      allowed.firstname = updatedEmployee.firstname;
    if (typeof updatedEmployee.lastname === "string")
      allowed.lastname = updatedEmployee.lastname;
    if (typeof updatedEmployee.contactnumber === "string")
      allowed.contactnumber = updatedEmployee.contactnumber;
    if (updatedEmployee.dateOfBirth)
      allowed.dateOfBirth = updatedEmployee.dateOfBirth;
    if (updatedEmployee.department)
      allowed.department = updatedEmployee.department;
    if (
      updatedEmployee.role &&
      ["Employee", "Manager"].includes(updatedEmployee.role)
    ) {
      allowed.role = updatedEmployee.role;
    }
    if (
      updatedEmployee.status &&
      ["Active", "Inactive"].includes(updatedEmployee.status)
    ) {
      allowed.status = updatedEmployee.status;
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: allowed },
      { new: true },
    ).select(
      "firstname lastname email contactnumber department status dateOfBirth",
    );

    return res
      .status(200)
      .json({ success: true, data: employee, type: "EmployeeUpdatedByHR" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: error, message: "internal server error" });
  }
};

export const HandleEmployeeDelete = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findOne({ _id: employeeId });

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "employee not found" });
    }

    // Instead of deleting, mark employee as Inactive to track attrition
    employee.status = "Inactive";
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee removed successfully",
      type: "EmployeeDelete",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: error, message: "internal server error" });
  }
};
