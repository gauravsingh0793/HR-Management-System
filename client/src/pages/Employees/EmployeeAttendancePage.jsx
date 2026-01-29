import { useCallback, useEffect, useState } from "react";
import { apiService } from "@/redux/apis/APIService";
import {
  EmployeeAttendanceEndPoints,
  EmployeeProfileEndPoints,
} from "@/redux/apis/APIsEndpoints";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useToast } from "@/hooks/use-toast.js";
import { Clock3, Loader2 } from "lucide-react";

export const EmployeeAttendancePage = () => {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [errorAttendance, setErrorAttendance] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const res = await apiService.get(EmployeeProfileEndPoints.GET, {
        withCredentials: true,
      });
      const data = res.data?.data;
      if (data) {
        setMe(data);
      }
    } catch (error) {
      // Handle error silently
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    setLoadingAttendance(true);
    setErrorAttendance("");
    try {
      const res = await apiService.get(EmployeeAttendanceEndPoints.MY, {
        withCredentials: true,
      });
      const data = res.data?.data;
      setAttendance(data);
      setAttendanceLogs(data?.attendancelog || []);
    } catch (error) {
      setErrorAttendance(
        error.response?.data?.message ||
          error.message ||
          "Unable to load attendance"
      );
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  const initializeAttendance = async () => {
    if (!me?._id) {
      toast({ title: "Profile not loaded yet" });
      return;
    }
    if (me?.biometricId) {
      toast({
        title: "Biometric attendance enabled",
        description:
          "Your attendance is created automatically from biometric punches.",
      });
      return;
    }
    try {
      await apiService.post(
        EmployeeAttendanceEndPoints.INITIALIZE,
        { employeeID: me._id },
        { withCredentials: true }
      );
      toast({ title: "Attendance initialized" });
      loadAttendance();
    } catch (error) {
      toast({
        title: "Could not initialize attendance",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markToday = async (status, markType) => {
    if (!attendance?._id) return;
    // Use local date (not UTC) so it matches the user's actual day
    const now = new Date();
    const currentdate = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    try {
      await apiService.patch(
        EmployeeAttendanceEndPoints.UPDATE,
        { attendanceID: attendance._id, status, currentdate, markType },
        { withCredentials: true }
      );
      toast({
        title: "Attendance marked",
        description: `Marked as ${status} successfully.`,
      });
      loadAttendance();
    } catch (error) {
      toast({
        title: "Could not update attendance",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadProfile();
    loadAttendance();
  }, [loadProfile, loadAttendance]);

  const getStatusColor = (status) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "present")
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (normalized === "absent")
      return "bg-red-100 text-red-700 border-red-200";
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  return (
    <div className="w-full mx-auto flex flex-col gap-6 animate-fade-in-up">
      {/* Header Card */}
      <Card className="frosted-card border-transparent shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/15 via-teal-400/15 to-green-500/15">
                <Clock3 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  My Attendance
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Track your daily attendance and work hours
                </CardDescription>
              </div>
            </div>
            {me?.biometricId ? (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Biometric attendance enabled
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                Manual attendance
              </div>
            )}
            {loadingAttendance && (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            )}
          </div>
        </CardHeader>
      </Card>

      <Card className="frosted-card border-transparent shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Attendance Records
          </CardTitle>
        </CardHeader>
        <div className="h-px bg-slate-200 mx-4 mb-3" />
        <CardContent>
          {errorAttendance && (
            <div className="text-sm text-red-600 mb-3">{errorAttendance}</div>
          )}
          {loadingAttendance ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 animate-pulse rounded"
                />
              ))}
            </div>
          ) : !attendance ? (
            <div className="flex items-center justify-between text-sm sm:text-base">
              <div className="text-slate-700">No attendance record yet.</div>
              <Button onClick={initializeAttendance}>Initialize</Button>
            </div>
          ) : (
            <>
              {me?.biometricId ? (
                <div className="mb-3 text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                  Your organization uses biometric devices to record your
                  attendance automatically. Manual marking is disabled.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button onClick={() => markToday("Present", "CHECK_IN")}>
                    Check In
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => markToday("Present", "CHECK_OUT")}
                  >
                    Check Out
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => markToday("Absent", "ABSENT")}
                  >
                    Mark Absent
                  </Button>
                </div>
              )}
              <div className="overflow-auto border border-slate-200 rounded-md">
                <table className="min-w-full text-sm text-slate-800">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left font-semibold text-slate-900 px-3 py-2">
                        Date
                      </th>
                      <th className="text-left font-semibold text-slate-900 px-3 py-2">
                        Status
                      </th>
                      <th className="text-left font-semibold text-slate-900 px-3 py-2">
                        Source
                      </th>
                      <th className="text-left font-semibold text-slate-900 px-3 py-2">
                        Check-in
                      </th>
                      <th className="text-left font-semibold text-slate-900 px-3 py-2">
                        Check-out
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.map((l, idx) => {
                      const status = l.logstatus || l.status;
                      const source = l.source || "Manual";
                      return (
                        <tr
                          key={idx}
                          className="odd:bg-white even:bg-slate-50 hover:bg-indigo-50 transition"
                        >
                          <td className="px-3 py-2 text-slate-700">
                            {
                              new Date(l.logdate || l.date)
                                .toISOString()
                                .split("T")[0]
                            }
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-700 text-xs">
                            {source}
                          </td>
                          <td className="px-3 py-2 text-slate-700 text-xs">
                            {l.checkInTime
                              ? new Date(l.checkInTime).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="px-3 py-2 text-slate-700 text-xs">
                            {l.checkOutTime
                              ? new Date(l.checkOutTime).toLocaleTimeString()
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
