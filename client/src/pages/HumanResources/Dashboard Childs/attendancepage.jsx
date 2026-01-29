import { useEffect, useState, useCallback, useMemo } from "react";
import { apiService } from "@/redux/apis/APIService";
import { HRAttendanceEndPoints } from "@/redux/apis/APIsEndpoints";
import DataTable from "@/components/common/DataTable.jsx";
import { Clock, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HRAttendancePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    apiService
      .get(HRAttendanceEndPoints.GETALL)
      .then((res) => {
        if (!active) return;
        setData(Array.isArray(res.data?.data) ? res.data.data : res.data);
      })
      .catch((e) => {
        if (!active) return;
        setError(e?.response?.data?.message || e.message || "Failed to load");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  // Transform data to show employee name, department, and formatted dates
  const transformedData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const flattened = [];
    data.forEach((attendance) => {
      if (
        attendance.attendancelog &&
        Array.isArray(attendance.attendancelog) &&
        attendance.attendancelog.length > 0
      ) {
        // Create a row for each attendance log entry
        attendance.attendancelog.forEach((log) => {
          flattened.push({
            _id: `${attendance._id}_${log.logdate}`,
            employeeName: attendance.employee
              ? `${attendance.employee.firstname || ""} ${
                  attendance.employee.lastname || ""
                }`.trim()
              : "-",
            department:
              attendance.employee?.department?.name ||
              (typeof attendance.employee?.department === "string" &&
              /^[0-9a-fA-F]{24}$/.test(attendance.employee?.department)
                ? "Loading..."
                : "Not specified"),
            date: log.logdate
              ? new Date(log.logdate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                })
              : "-",
            status: log.logstatus || attendance.status || "Not Specified",
            statusColor:
              (
                log.logstatus ||
                attendance.status ||
                "Not Specified"
              ).toLowerCase() === "present"
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : (
                    log.logstatus ||
                    attendance.status ||
                    "Not Specified"
                  ).toLowerCase() === "absent"
                ? "bg-red-100 text-red-700 border-red-200"
                : "bg-yellow-100 text-yellow-700 border-yellow-200",
            source: log.source || "-",
            checkInTime: log.checkInTime
              ? new Date(log.checkInTime).toLocaleTimeString()
              : "-",
            checkOutTime: log.checkOutTime
              ? new Date(log.checkOutTime).toLocaleTimeString()
              : "-",
            originalData: attendance,
          });
        });
      } else {
        // If no attendance logs, show the main attendance record
        flattened.push({
          _id: attendance._id,
          employeeName: attendance.employee
            ? `${attendance.employee.firstname || ""} ${
                attendance.employee.lastname || ""
              }`.trim()
            : "-",
          department:
            attendance.employee?.department?.name ||
            (typeof attendance.employee?.department === "string" &&
            /^[0-9a-fA-F]{24}$/.test(attendance.employee?.department)
              ? "Loading..."
              : "Not specified"),
          date: attendance.createdAt
            ? new Date(attendance.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                weekday: "short",
              })
            : "-",
          status: attendance.status || "Not Specified",
          statusColor:
            (attendance.status || "Not Specified").toLowerCase() === "present"
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : (attendance.status || "Not Specified").toLowerCase() ===
                "absent"
              ? "bg-red-100 text-red-700 border-red-200"
              : "bg-yellow-100 text-yellow-700 border-yellow-200",
          source: "-",
          checkInTime: "-",
          checkOutTime: "-",
          originalData: attendance,
        });
      }
    });

    return flattened;
  }, [data]);

  const columns = useMemo(
    () => [
      { key: "employeeName", label: "Employee Name" },
      { key: "department", label: "Department" },
      { key: "date", label: "Date" },
      { key: "status", label: "Status" },
      { key: "source", label: "Source" },
      { key: "checkInTime", label: "Check-in" },
      { key: "checkOutTime", label: "Check-out" },
    ],
    []
  );

  return (
    <div className="w-full mx-auto flex flex-col gap-6 animate-fade-in-up">
      {/* Header Card */}
      <Card className="frosted-card border-transparent shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/15 via-cyan-400/15 to-blue-500/15">
                <Clock className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Attendance Management
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Track and monitor employee attendance records
                </CardDescription>
              </div>
            </div>
            {loading && (
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            )}
          </div>
        </CardHeader>
      </Card>

      <DataTable
        title="Attendance Records"
        description={`${transformedData.length} attendance record${
          transformedData.length !== 1 ? "s" : ""
        } in the system`}
        data={transformedData}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={load}
        cardClassName="m-0 w-full frosted-card border-transparent shadow-lg"
      />
    </div>
  );
}
