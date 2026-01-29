import { Attendance } from "../models/Attendance.model.js";
import { Employee } from "../models/Employee.model.js";

export const HandleInitializeAttendance = async (req, res) => {
  try {
    const { employeeID } = req.body;

    if (!employeeID) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
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

    if (employee.attendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance Log already initialized for this employee",
      });
    }

    const currentdate = new Date().toISOString().split("T")[0];
    const attendancelog = {
      logdate: currentdate,
      logstatus: "Not Specified",
    };

    const newAttendance = await Attendance.create({
      employee: employeeID,
      status: "Not Specified",
      organizationID: req.ORGID,
    });

    newAttendance.attendancelog.push(attendancelog);
    employee.attendance = newAttendance._id;

    await employee.save();
    await newAttendance.save();

    return res.status(200).json({
      success: true,
      message: "Attendance Log Initialized Successfully",
      data: newAttendance,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

export const HandleAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      organizationID: req.ORGID,
    }).populate({
      path: "employee",
      select: "firstname lastname department",
      populate: {
        path: "department",
        select: "name",
      },
    });
    return res.status(200).json({
      success: true,
      message: "All attendance records retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

export const HandleMyAttendance = async (req, res) => {
  try {
    // Find attendance record by employee ID
    const employee = await Employee.findOne({
      _id: req.EMid,
      organizationID: req.ORGID,
    }).select("attendance");
    if (!employee || !employee.attendance) {
      return res.status(200).json({
        success: true,
        message: "No attendance initialized",
        data: null,
      });
    }
    const attendance = await Attendance.findOne({
      _id: employee.attendance,
      organizationID: req.ORGID,
    });
    if (!attendance) {
      return res.status(200).json({
        success: true,
        message: "No attendance initialized",
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Your attendance retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

export const HandleAttendance = async (req, res) => {
  try {
    const { attendanceID } = req.params;

    if (!attendanceID) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const attendance = await Attendance.findOne({
      _id: attendanceID,
      organizationID: req.ORGID,
    }).populate("employee", "firstname lastname department");

    if (!attendance) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance record retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

export const HandleUpdateAttendance = async (req, res) => {
  try {
    const { attendanceID, status, currentdate, markType } = req.body;

    const attendance = await Attendance.findOne({
      _id: attendanceID,
      organizationID: req.ORGID,
    });

    if (!attendance) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance not found" });
    }

    // Normalize date-only comparison
    const FindDate = attendance.attendancelog.find((item) => {
      if (!item.logdate) return false;
      const d = new Date(item.logdate);
      return d.toISOString().split("T")[0] === currentdate;
    });

    const now = new Date();

    if (!FindDate) {
      const newLog = {
        logdate: new Date(currentdate),
        logstatus: status,
        source: "Manual",
      };

      if (markType === "CHECK_IN") {
        newLog.checkInTime = now;
      } else if (markType === "CHECK_OUT") {
        newLog.checkOutTime = now;
      }

      attendance.attendancelog.push(newLog);
    } else {
      FindDate.logstatus = status;
      FindDate.source = "Manual";

      if (markType === "CHECK_IN" && !FindDate.checkInTime) {
        FindDate.checkInTime = now;
      }
      if (markType === "CHECK_OUT") {
        FindDate.checkOutTime = now;
      }
    }

    // Top-level status mirrors last manual status for the day
    attendance.status = status;

    await attendance.save();
    return res.status(200).json({
      success: true,
      message: "Attendance status updated successfully",
      data: attendance,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

export const HandleDeleteAttendance = async (req, res) => {
  try {
    const { attendanceID } = req.params;
    const attendance = await Attendance.findOne({
      _id: attendanceID,
      organizationID: req.ORGID,
    });

    if (!attendance) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance not found" });
    }

    const employee = await Employee.findById(attendance.employee);
    employee.attendance = null;

    await employee.save();
    await attendance.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

// Biometric punch endpoint for devices
export const HandleBiometricPunch = async (req, res) => {
  try {
    const { biometricId, timestamp, direction, secret } = req.body || {};

    if (!biometricId) {
      return res
        .status(400)
        .json({ success: false, message: "biometricId is required" });
    }

    // Simple shared-secret protection for biometric device
    const expected = process.env.BIOMETRIC_SECRET;
    if (expected && secret !== expected) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid biometric secret" });
    }

    const punchTime = timestamp ? new Date(timestamp) : new Date();
    if (Number.isNaN(punchTime.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid timestamp" });
    }

    // Find employee by biometricId
    const employee = await Employee.findOne({ biometricId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found for biometricId",
      });
    }

    const orgId = employee.organizationID;

    // Find or create attendance record
    let attendance = null;
    if (employee.attendance) {
      attendance = await Attendance.findOne({
        _id: employee.attendance,
        organizationID: orgId,
      });
    }

    if (!attendance) {
      attendance = await Attendance.create({
        employee: employee._id,
        status: "Not Specified",
        organizationID: orgId,
      });
      employee.attendance = attendance._id;
      await employee.save();
    }

    const dateOnly = new Date(
      punchTime.getFullYear(),
      punchTime.getMonth(),
      punchTime.getDate()
    );

    let logEntry = attendance.attendancelog.find((item) => {
      if (!item.logdate) return false;
      const d = new Date(item.logdate);
      return (
        d.getFullYear() === dateOnly.getFullYear() &&
        d.getMonth() === dateOnly.getMonth() &&
        d.getDate() === dateOnly.getDate()
      );
    });

    if (!logEntry) {
      logEntry = {
        logdate: dateOnly,
        logstatus: "Present",
        checkInTime: punchTime,
        source: "Biometric",
      };
      attendance.attendancelog.push(logEntry);
    } else {
      // Always mark as Present if there is any biometric punch that day
      logEntry.logstatus = "Present";
      logEntry.source = "Biometric";
      if ((direction || "IN").toUpperCase() === "OUT") {
        logEntry.checkOutTime = punchTime;
      } else if (!logEntry.checkInTime) {
        logEntry.checkInTime = punchTime;
      }
    }

    // Top-level status reflects today's status
    attendance.status = "Present";

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Biometric punch recorded",
      data: attendance,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error });
  }
};
