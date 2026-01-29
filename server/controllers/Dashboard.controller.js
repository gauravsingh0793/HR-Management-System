import { Employee } from "../models/Employee.model.js";
import { Department } from "../models/Department.model.js";
import { Leave } from "../models/Leave.model.js";
import { Salary } from "../models/Salary.model.js";
import { Notice } from "../models/Notice.model.js";
import { GenerateRequest } from "../models/GenerateRequest.model.js";
import { Balance } from "../models/Balance.model.js";
import { Attendance } from "../models/Attendance.model.js";
import { Review } from "../models/Review.model.js";
import { Interviewinsight } from "../models/InterviewInsights.model.js";

export const HandleHRDashboard = async (req, res) => {
  try {
    const employees = await Employee.countDocuments({
      organizationID: req.ORGID,
      status: "Active",
    });
    const departments = await Department.countDocuments({
      organizationID: req.ORGID,
    });
    const leaves = await Leave.countDocuments({
      organizationID: req.ORGID,
      status: "Pending",
    });
    const requestes = await GenerateRequest.countDocuments({
      organizationID: req.ORGID,
      status: "Pending",
    });
    const balance = await Balance.find({ organizationID: req.ORGID });
    const notices = await Notice.find({ organizationID: req.ORGID })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("createdby", "firstname lastname");

    // Salary aggregations
    const salaries = await Salary.find({ organizationID: req.ORGID });
    const totalPaid = salaries
      .filter((s) => s.status === "Paid")
      .reduce((sum, s) => sum + (s.netpay || 0), 0);
    const totalPending = salaries
      .filter((s) => s.status === "Pending")
      .reduce((sum, s) => sum + (s.netpay || 0), 0);
    const totalDelayed = salaries
      .filter((s) => s.status === "Delayed")
      .reduce((sum, s) => sum + (s.netpay || 0), 0);
    const pendingCount = salaries.filter((s) => s.status === "Pending").length;
    const delayedCount = salaries.filter((s) => s.status === "Delayed").length;

    // Employee analytics - calculate hires and attrition for last 8 months
    const now = new Date();
    const eightMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, 1);

    const allEmployees = await Employee.find({
      organizationID: req.ORGID,
    }).select("createdAt status updatedAt");

    const employeeAnalytics = [];
    for (let i = 7; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        1,
      );
      const monthName = monthDate.toLocaleString("en-US", { month: "short" });

      // Count hires (employees created in this month)
      const hires = allEmployees.filter((emp) => {
        const createdDate = new Date(emp.createdAt);
        return createdDate >= monthDate && createdDate < nextMonthDate;
      }).length;

      // Count attrition (employees who became inactive in this month)
      const attrition = allEmployees.filter((emp) => {
        const updatedDate = new Date(emp.updatedAt);
        return (
          emp.status === "Inactive" &&
          updatedDate >= monthDate &&
          updatedDate < nextMonthDate
        );
      }).length;

      // Calculate headcount at end of month (active employees up to that point)
      const headcount = allEmployees.filter((emp) => {
        const createdDate = new Date(emp.createdAt);
        const isCreatedBefore = createdDate < nextMonthDate;
        const isActive = emp.status === "Active";
        const becameInactiveAfter =
          emp.status === "Inactive"
            ? new Date(emp.updatedAt) >= nextMonthDate
            : true;
        return isCreatedBefore && (isActive || becameInactiveAfter);
      }).length;

      employeeAnalytics.push({
        month: monthName,
        headcount,
        hires,
        attrition,
      });
    }

    // Attendance overview by department
    const departmentsWithEmployees = await Department.find({
      organizationID: req.ORGID,
    })
      .populate({
        path: "employees",
        select: "firstname lastname attendance",
        populate: {
          path: "attendance",
          select: "status attendancelog",
        },
      })
      .select("name employees");

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const attendanceByDepartment = departmentsWithEmployees.map((dept) => {
      let present = 0;
      let absent = 0;
      let late = 0;

      dept.employees.forEach((emp) => {
        if (emp.attendance && emp.attendance.attendancelog) {
          // Find today's attendance log
          const todayLog = emp.attendance.attendancelog.find((log) => {
            const logDate = new Date(log.logdate);
            logDate.setUTCHours(0, 0, 0, 0);
            return logDate.getTime() === today.getTime();
          });

          if (todayLog) {
            if (todayLog.logstatus === "Present") {
              present++;
            } else if (todayLog.logstatus === "Absent") {
              absent++;
            }
          }
        }
      });

      // For mock "late" count, you can implement additional logic based on check-in time
      // For now, setting late as a small percentage of present
      late = Math.floor(present * 0.05); // 5% of present marked as late (placeholder)

      // Create abbreviation from department name (first letter of each word)
      const createAbbreviation = (name) => {
        if (!name) return "UD";
        return name
          .split(/\s+/)
          .map((word) => word.charAt(0).toUpperCase())
          .join("");
      };

      return {
        team: createAbbreviation(dept.name),
        fullName: dept.name || "Unnamed Department",
        present,
        late,
      };
    });

    // Employees per department distribution (for pie chart)
    const employeesWithDepartments = await Employee.find({
      organizationID: req.ORGID,
      status: "Active",
    }).populate("department", "name");

    // console.log("Total active employees:", employeesWithDepartments.length);
    // console.log(
    //   "Sample employee department:",
    //   employeesWithDepartments[0]?.department,
    // );

    // Count employees by department manually
    const departmentCounts = {};
    employeesWithDepartments.forEach((emp) => {
      if (emp.department && emp.department._id) {
        const deptId = emp.department._id.toString();
        const deptName = emp.department.name || "Unnamed Department";
        if (!departmentCounts[deptId]) {
          departmentCounts[deptId] = { name: deptName, count: 0 };
        }
        departmentCounts[deptId].count++;
      } else {
        // Employees without department
        if (!departmentCounts["no-department"]) {
          departmentCounts["no-department"] = {
            name: "Not Specified",
            count: 0,
          };
        }
        departmentCounts["no-department"].count++;
      }
    });

    console.log("Department counts:", departmentCounts);

    const employeeDistributionByDepartment = Object.entries(departmentCounts)
      .map(([deptId, data]) => ({
        departmentId: deptId,
        name: data.name,
        count: data.count,
      }))
      .filter((item) => item.count > 0);

    // Organization-wide performance metrics from manager reviews
    const orgReviews = await Review.find({
      organizationID: req.ORGID,
    }).select("overallScore createdAt");

    let overallReviewSum = 0;
    let overallReviewCount = 0;

    orgReviews.forEach((rev) => {
      if (typeof rev.overallScore === "number") {
        overallReviewSum += rev.overallScore;
        overallReviewCount += 1;
      }
    });

    const overallAverageReviewScore =
      overallReviewCount > 0
        ? Number((overallReviewSum / overallReviewCount).toFixed(2))
        : null;

    // Build simple monthly trend for last 6 months (reuse existing `now`)
    const performanceMonthlyTrend = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        1,
      );

      const monthName = monthDate.toLocaleString("en-US", { month: "short" });

      let sum = 0;
      let count = 0;

      orgReviews.forEach((rev) => {
        const created = new Date(rev.createdAt);
        if (created >= monthDate && created < nextMonthDate) {
          if (typeof rev.overallScore === "number") {
            sum += rev.overallScore;
            count += 1;
          }
        }
      });

      performanceMonthlyTrend.push({
        month: monthName,
        averageScore: count > 0 ? Number((sum / count).toFixed(2)) : null,
        reviewCount: count,
      });
    }

    // Get all employees with attendance reference

    const employeesWithAttendance = await Employee.find({
      organizationID: req.ORGID,
    })
      .select("_id firstname lastname email attendance status")
      .populate({
        path: "attendance",
        select: "attendancelog",
      });

    // Build status list
    const employeeAttendanceStatus = employeesWithAttendance.map((emp) => {
      let isActive = false;
      if (emp.attendance && emp.attendance.attendancelog) {
        const todayLog = emp.attendance.attendancelog.find((log) => {
          const logDate = new Date(log.logdate);
          logDate.setUTCHours(0, 0, 0, 0);
          return logDate.getTime() === today.getTime();
        });

        if (todayLog && todayLog.logstatus === "Present") {
          // Check if employee has checked in
          if (todayLog.checkInTime) {
            const checkInDate = new Date(todayLog.checkInTime);
            const hoursSinceCheckIn = (now - checkInDate) / (1000 * 60 * 60);

            // Check if there's a valid checkout
            const hasCheckedOut =
              todayLog.checkOutTime &&
              !isNaN(new Date(todayLog.checkOutTime).getTime());

            // Active only if: checked in, not checked out, and less than 12 hours
            if (!hasCheckedOut && hoursSinceCheckIn < 12) {
              isActive = true;
            }
          } else {
            // If no checkInTime but status is Present, consider active
            isActive = true;
          }
        }
      }
      return {
        _id: emp._id,
        firstname: emp.firstname,
        lastname: emp.lastname,
        email: emp.email,
        status: isActive ? "Active" : "Inactive",
      };
    });

    // Interview Insights Statistics
    const interviewInsights = await Interviewinsight.find({
      organizationID: req.ORGID,
    }).select("interviewStatus");

    const interviewStats = {
      total: interviewInsights.length,
      pending: interviewInsights.filter((i) => i.interviewStatus === "Pending")
        .length,
      completed: interviewInsights.filter(
        (i) => i.interviewStatus === "Completed",
      ).length,
      cancelled: interviewInsights.filter(
        (i) => i.interviewStatus === "Cancelled",
      ).length,
    };

    return res.status(200).json({
      success: true,
      data: {
        employees: employees,
        departments: departments,
        leaves: leaves,
        requestes: requestes,
        balance: balance,
        notices: notices,
        salaryStats: {
          totalPaid,
          totalPending,
          totalDelayed,
          pendingCount,
          delayedCount,
        },
        employeeAnalytics: employeeAnalytics,
        attendanceByDepartment: attendanceByDepartment,
        employeeDistributionByDepartment: employeeDistributionByDepartment,
        performanceMetrics: {
          overallAverageReviewScore,
          totalReviews: overallReviewCount,
          monthlyTrend: performanceMonthlyTrend,
        },
        employeeAttendanceStatus: employeeAttendanceStatus,
        interviewStats: interviewStats,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: error, message: "internal server error" });
  }
};
