import { useEffect, useMemo, useState } from "react";
// SidebarInset removed to avoid provider dependency for this standalone layout
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { apiService } from "@/redux/apis/APIService";
import {
  EmployeeProfileEndPoints,
  HREmployeesPageEndPoints,
  EmployeeAttendanceEndPoints,
} from "@/redux/apis/APIsEndpoints";
import { EmployeePerformanceEndPoints } from "@/redux/apis/APIsEndpoints";
import {
  CalendarDays,
  Clock3,
  Filter,
  PieChart,
  UserX,
  Cake,
  CheckCircle2,
  ListTodo,
} from "lucide-react";

export const EmployeeDashboardPage = () => {
  const [me, setMe] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [performanceValue, setPerformanceValue] = useState(0);
  const [monthlyPerformance, setMonthlyPerformance] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [todayLog, setTodayLog] = useState(null);
  const [hoursWorked, setHoursWorked] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await apiService.get(EmployeeProfileEndPoints.GET, {
          withCredentials: true,
        });
        setMe(profileRes.data?.data || null);
      } catch (err) {
        setMe(null);
      }
    };
    load();
  }, []);

  useEffect(() => {
    // Load organization employees only for managers via manager-specific API
    const loadEmployees = async () => {
      if (!me || me.role !== "Manager") {
        // Non-managers don't need org-wide employees list
        return;
      }

      setLoadingEmployees(true);
      try {
        const res = await apiService.get(ManagerEndPoints.EMPLOYEES, {
          withCredentials: true,
        });
        if (res.data?.success && res.data?.data) {
          setEmployees(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load employees:", err);
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [me]);

  // Filter absent and half-day employees from real data
  const absentEmployees = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return employees
      .filter((emp) => {
        const status = emp.attendanceStatus?.toLowerCase();
        return (
          status === "absent" || status === "half day" || status === "half-day"
        );
      })
      .map((emp) => {
        const firstInitial = (emp.firstname || "").charAt(0).toUpperCase();
        const lastInitial = (emp.lastname || "").charAt(0).toUpperCase();
        const status = emp.attendanceStatus?.toLowerCase();

        return {
          name:
            `${emp.firstname || ""} ${emp.lastname || ""}`.trim() || "Unknown",
          status:
            status === "half day" || status === "half-day"
              ? "Half Day"
              : "Absent",
          department: emp.department?.name || "Not specified",
          avatar: `${firstInitial}${lastInitial}`,
          color:
            status === "absent"
              ? "bg-rose-100 text-rose-700"
              : "bg-amber-100 text-amber-700",
        };
      });
  }, [employees]);

  const displayName = useMemo(() => {
    const full = [me?.firstname, me?.lastname].filter(Boolean).join(" ").trim();
    return full || "Gaurav Singh";
  }, [me]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);
  const thought = "Progress is built one focused day at a time.";
  const performanceRing = useMemo(() => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const progress = (performanceValue / 100) * circumference;
    return { radius, circumference, progress };
  }, [performanceValue]);

  const timeLogRing = useMemo(() => {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const normalized = Math.min(Math.max(hoursWorked / 8, 0), 1);
    const progress = normalized * circumference;
    return { radius, circumference, progress };
  }, [hoursWorked]);

  const announcements = useMemo(
    () => [
      { date: "Dec 20", title: "Quarterly town hall" },
      { date: "Dec 22", title: "Security training deadline" },
      { date: "Dec 24", title: "Holiday schedule notice" },
    ],
    []
  );

  const leaveNotices = useMemo(
    () => [
      { name: "Ananya Rao", dates: "Dec 21 - Dec 24", type: "Annual Leave" },
      { name: "David Kim", dates: "Dec 23", type: "Half-day" },
    ],
    []
  );

  // Real upcoming birthdays from employee data
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const colors = [
      "bg-pink-100 text-pink-700",
      "bg-indigo-100 text-indigo-700",
      "bg-teal-100 text-teal-700",
      "bg-emerald-100 text-emerald-700",
      "bg-purple-100 text-purple-700",
      "bg-rose-100 text-rose-700",
    ];

    return employees
      .filter((emp) => emp.dateOfBirth)
      .map((emp) => {
        const dob = new Date(emp.dateOfBirth);
        const birthMonth = dob.getMonth();
        const birthDay = dob.getDate();

        // Calculate days until birthday
        let daysUntil;
        if (birthMonth === currentMonth && birthDay === currentDay) {
          daysUntil = 0;
        } else if (birthMonth === currentMonth && birthDay === currentDay + 1) {
          daysUntil = 1;
        } else {
          const thisBirthday = new Date(
            today.getFullYear(),
            birthMonth,
            birthDay
          );
          if (thisBirthday < today) {
            thisBirthday.setFullYear(today.getFullYear() + 1);
          }
          daysUntil = Math.ceil((thisBirthday - today) / (1000 * 60 * 60 * 24));
        }

        return {
          emp,
          daysUntil,
          birthMonth,
          birthDay,
          dob,
        };
      })
      .filter((item) => item.daysUntil <= 30) // Show birthdays within next 30 days
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 4) // Show only 4 upcoming birthdays
      .map((item, index) => {
        const { emp, daysUntil, dob } = item;
        const firstInitial = (emp.firstname || "").charAt(0).toUpperCase();
        const lastInitial = (emp.lastname || "").charAt(0).toUpperCase();

        let dateStr;
        if (daysUntil === 0) {
          dateStr = "Today";
        } else if (daysUntil === 1) {
          dateStr = "Tomorrow";
        } else {
          dateStr = dob.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }

        return {
          name:
            `${emp.firstname || ""} ${emp.lastname || ""}`.trim() || "Unknown",
          date: dateStr,
          department: emp.department?.name || "Not specified",
          avatar: `${firstInitial}${lastInitial}`,
          color: colors[index % colors.length],
        };
      });
  }, [employees]);

  // Load composite performance (attendance + deadlines + reviews) for this employee
  useEffect(() => {
    const loadPerformance = async () => {
      try {
        const res = await apiService.get(EmployeePerformanceEndPoints.MY, {
          withCredentials: true,
        });
        const data = res.data?.data;
        if (data) {
          setPerformanceValue(data.percent || 0);
          setMonthlyPerformance(
            Array.isArray(data.monthlyTrend) ? data.monthlyTrend : []
          );
        }
      } catch {
        setPerformanceValue(0);
        setMonthlyPerformance([]);
      }
    };

    loadPerformance();
  }, []);

  // Calculate performance from attendance logs (self attendance) for calendar + timelog
  useEffect(() => {
    const loadAttendancePerformance = async () => {
      try {
        const res = await apiService.get(EmployeeAttendanceEndPoints.MY, {
          withCredentials: true,
        });
        const data = res.data?.data;
        const logs = Array.isArray(data?.attendancelog)
          ? data.attendancelog
          : [];

        setAttendanceLogs(logs);

        // Find today's attendance log and compute worked hours
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEntry = logs.find((log) => {
          if (!log?.logdate) return false;
          const d = new Date(log.logdate);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });

        setTodayLog(todayEntry || null);

        if (todayEntry?.checkInTime && todayEntry?.checkOutTime) {
          const start = new Date(todayEntry.checkInTime);
          const end = new Date(todayEntry.checkOutTime);
          const diffHours = Math.max(0, (end - start) / (1000 * 60 * 60));
          setHoursWorked(Number(diffHours.toFixed(2)));
        } else {
          setHoursWorked(0);
        }

        if (!logs.length) {
          setPerformanceValue(0);
          return;
        }

        let total = 0;
        let score = 0;

        logs.forEach((log) => {
          if (!log || !log.logstatus) return;
          total += 1;
          const status = String(log.logstatus).toLowerCase();
          if (status === "present") score += 1;
          else if (status === "half day" || status === "half-day") score += 0.5;
        });

        if (!total) {
          setPerformanceValue(0);
          return;
        }

        const value = Math.round((score / total) * 100);
        setPerformanceValue(value);
      } catch {
        setPerformanceValue(0);
        setAttendanceLogs([]);
        setTodayLog(null);
        setHoursWorked(0);
      }
    };

    loadAttendancePerformance();
  }, []);

  // Mock data for tasks
  const tasks = useMemo(
    () => ({
      total: 12,
      completed: 8,
      pending: 4,
      items: [
        {
          id: 1,
          title: "Complete quarterly report",
          priority: "High",
          dueDate: "Today",
        },
        {
          id: 2,
          title: "Review team feedback",
          priority: "Medium",
          dueDate: "Tomorrow",
        },
        {
          id: 3,
          title: "Update project documentation",
          priority: "Low",
          dueDate: "Dec 22",
        },
        {
          id: 4,
          title: "Prepare presentation slides",
          priority: "High",
          dueDate: "Dec 23",
        },
      ],
    }),
    []
  );

  const calendarMeta = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const start = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const monthName = now.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    return { year, month, start, days, monthName };
  }, []);

  const calendarDays = useMemo(() => {
    const blanks = Array.from({ length: calendarMeta.start }, () => null);
    const nums = Array.from({ length: calendarMeta.days }, (_, i) => i + 1);
    return [...blanks, ...nums];
  }, [calendarMeta]);

  const todayInfo = useMemo(() => {
    const d = new Date();
    const day = d.getDate();
    const formatted = `${String(day).padStart(2, "0")} ${d.toLocaleString(
      "en-US",
      { month: "short" }
    )}, ${d.getFullYear()}`;
    return { day, month: d.getMonth(), year: d.getFullYear(), formatted };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] items-start">
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="text-2xl font-normal text-slate-900">
                {greeting} <span className="font-semibold">{displayName}</span>{" "}
                👋
              </div>
              <div className="text-sm text-indigo-700">{thought}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Employee Performance
                </CardTitle>
                <div className="text-xs text-slate-500 mt-0.5">
                  Last 6 months (overall)
                </div>
              </div>
              <div className="text-xs text-slate-500 text-right">
                {monthlyPerformance.length
                  ? `Latest: ${
                      monthlyPerformance[monthlyPerformance.length - 1].month
                    }`
                  : "No data"}
              </div>
            </CardHeader>
            <div className="h-px bg-slate-200 mx-4 mb-3" />
            <CardContent className="pt-1 flex flex-col sm:flex-row items-center gap-5">
              <div className="relative w-36 h-36 shrink-0">
                <svg className="absolute inset-0" viewBox="0 0 144 144">
                  <circle
                    cx="72"
                    cy="72"
                    r={performanceRing.radius}
                    strokeWidth="10"
                    className="text-slate-200"
                    stroke="currentColor"
                    fill="none"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r={performanceRing.radius}
                    strokeWidth="10"
                    className="text-emerald-500"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${performanceRing.progress} ${performanceRing.circumference}`}
                    transform="rotate(-90 72 72)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-3xl font-semibold text-slate-900">
                    {performanceValue}%
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-700 leading-relaxed text-center sm:text-left">
                This score combines your attendance, how well you meet task
                deadlines, and your manager reviews.
              </div>
            </CardContent>
          </Card>
          {monthlyPerformance.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Monthly Performance
                </CardTitle>
              </CardHeader>
              <div className="h-px bg-slate-200 mx-4 mb-3" />
              <CardContent className="pt-1">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  {monthlyPerformance.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"
                    >
                      <div className="text-[11px] font-medium text-slate-700">
                        {m.month}
                      </div>
                      <div className="text-[11px] font-semibold text-indigo-700">
                        {typeof m.percent === "number" ? `${m.percent}%` : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Absent/Half-day Employees Card */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-50">
                  <UserX className="w-4 h-4 text-red-600" />
                </div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Today's Absences
                </CardTitle>
              </div>
            </CardHeader>
            <div className="h-px bg-slate-200 mx-4 mb-3" />
            <CardContent className="pt-0 space-y-3">
              {loadingEmployees ? (
                <div className="text-sm text-slate-500 text-center py-4">
                  Loading...
                </div>
              ) : absentEmployees.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4">
                  No absences today! Everyone is present. 🎉
                </div>
              ) : (
                absentEmployees.map((employee, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-50/50 hover:from-white hover:to-slate-50 border border-slate-100 hover:border-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${employee.color} flex items-center justify-center text-sm font-semibold shrink-0 shadow-sm`}
                    >
                      {employee.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate">
                        {employee.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {employee.department}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          employee.status === "Absent"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {employee.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Employee Birthdays Card */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-pink-50">
                  <Cake className="w-4 h-4 text-pink-600" />
                </div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Upcoming Birthdays
                </CardTitle>
              </div>
            </CardHeader>
            <div className="h-px bg-slate-200 mx-4 mb-3" />
            <CardContent className="pt-0 space-y-3">
              {loadingEmployees ? (
                <div className="text-sm text-slate-500 text-center py-4">
                  Loading...
                </div>
              ) : upcomingBirthdays.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4">
                  No upcoming birthdays in the next 30 days. 🎂
                </div>
              ) : (
                upcomingBirthdays.map((employee, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-50/50 to-purple-50/30 hover:from-pink-50 hover:to-purple-50 border border-pink-100 hover:border-pink-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${employee.color} flex items-center justify-center text-sm font-semibold shrink-0 shadow-sm`}
                    >
                      {employee.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate">
                        {employee.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {employee.department}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          employee.date === "Today"
                            ? "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border border-pink-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        🎂 {employee.date}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="shadow-sm self-start">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock3
                    className="w-4 h-4 text-indigo-600"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Time Log
                  </CardTitle>
                </div>
                <div className="text-xs text-slate-600 text-right">
                  {todayInfo.formatted}
                </div>
              </div>
            </CardHeader>
            <div className="h-px bg-slate-200 mx-4 mb-3" />
            <CardContent className="pt-2 space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative w-32 h-32">
                  <svg className="absolute inset-0" viewBox="0 0 140 140">
                    <circle
                      cx="70"
                      cy="70"
                      r={timeLogRing.radius}
                      strokeWidth="10"
                      className="text-slate-200"
                      stroke="currentColor"
                      fill="none"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={timeLogRing.radius}
                      strokeWidth="10"
                      className="text-emerald-500"
                      stroke="currentColor"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${timeLogRing.progress} ${timeLogRing.circumference}`}
                      transform="rotate(-90 70 70)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl font-semibold text-slate-900">
                      {hoursWorked > 0 ? `${hoursWorked.toFixed(1)}h` : "0h"}
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <table className="w-full text-xs text-left border border-slate-100 rounded-lg overflow-hidden">
                    <thead className="bg-indigo-50 text-slate-700">
                      <tr>
                        <th className="px-3 py-2 font-semibold text-slate-900">
                          Location
                        </th>
                        <th className="px-3 py-2 font-semibold text-slate-900">
                          In Time
                        </th>
                        <th className="px-3 py-2 font-semibold text-slate-900">
                          Out Time
                        </th>
                        <th className="px-3 py-2 font-semibold text-slate-900">
                          Presence
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white text-slate-800">
                      {todayLog ? (
                        <tr className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-900">
                            {todayLog.source || "Manual"}
                          </td>
                          <td className="px-3 py-2">
                            {todayLog.checkInTime
                              ? new Date(
                                  todayLog.checkInTime
                                ).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="px-3 py-2">
                            {todayLog.checkOutTime
                              ? new Date(
                                  todayLog.checkOutTime
                                ).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="px-3 py-2 font-semibold">
                            {todayLog.logstatus || "Not Specified"}
                          </td>
                        </tr>
                      ) : (
                        <tr className="border-t border-slate-100">
                          <td
                            className="px-3 py-2 text-slate-500 text-center"
                            colSpan={4}
                          >
                            No time log for today yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    className="w-4 h-4 text-blue-600"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Calendar
                  </CardTitle>
                </div>
                <div className="text-xs text-slate-600 text-right">
                  {calendarMeta.monthName}
                </div>
              </div>
            </CardHeader>
            <div className="h-px bg-slate-200 mx-4 mb-3" />
            <CardContent className="pt-2">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-indigo-700 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 rounded-lg p-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-1 rounded-md">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {calendarDays.map((d, i) => {
                  const isToday =
                    Boolean(d) &&
                    todayInfo.year === calendarMeta.year &&
                    todayInfo.month === calendarMeta.month &&
                    todayInfo.day === d;
                  const isWeekend = Boolean(d) && (i % 7 === 0 || i % 7 === 6);

                  let isPresent = false;
                  let isAbsent = false;

                  if (d) {
                    const cellDate = new Date(
                      calendarMeta.year,
                      calendarMeta.month,
                      d
                    );
                    cellDate.setHours(0, 0, 0, 0);

                    const log = attendanceLogs.find((entry) => {
                      if (!entry?.logdate) return false;
                      const ld = new Date(entry.logdate);
                      ld.setHours(0, 0, 0, 0);
                      return ld.getTime() === cellDate.getTime();
                    });

                    if (log?.logstatus) {
                      const status = String(log.logstatus).toLowerCase();
                      if (status === "present") isPresent = true;
                      if (status === "absent") isAbsent = true;
                    }
                  }

                  let style = "";
                  if (!d) {
                    style = "text-slate-300";
                  } else if (isToday) {
                    style =
                      "bg-indigo-100 border border-indigo-300 text-indigo-800 font-semibold shadow-sm";
                  } else if (isPresent) {
                    style =
                      "bg-emerald-100 border border-emerald-300 text-emerald-800 font-medium";
                  } else if (isAbsent) {
                    style =
                      "bg-red-100 border border-red-300 text-red-700 font-medium";
                  } else if (isWeekend) {
                    style =
                      "bg-orange-50 border border-orange-200 text-orange-700";
                  } else {
                    style = "bg-white border border-slate-200 text-slate-900";
                  }
                  return (
                    <div
                      key={i}
                      className={`h-9 flex items-center justify-center rounded-md ${style}`}
                    >
                      {d || ""}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Task Management Card */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50">
                  <ListTodo className="w-4 h-4 text-blue-600" />
                </div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  My Tasks
                </CardTitle>
              </div>
            </CardHeader>
            <div className="h-px bg-slate-200 mx-4 mb-3" />
            <CardContent className="pt-0 space-y-4">
              {/* Task Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                  <div className="text-2xl font-bold text-blue-700">
                    {tasks.total}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Total Tasks</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
                  <div className="text-2xl font-bold text-emerald-700">
                    {tasks.completed}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Completed</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100">
                  <div className="text-2xl font-bold text-amber-700">
                    {tasks.pending}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Pending</div>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Pending Tasks
                </div>
                {tasks.items.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-white to-slate-50 hover:from-blue-50 hover:to-indigo-50 border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate mb-1">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                            task.priority === "High"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : task.priority === "Medium"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-slate-500">
                          Due: {task.dueDate}
                        </span>
                      </div>
                    </div>
                    <button className="shrink-0 p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-300 transition-all duration-200 opacity-0 group-hover:opacity-100">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                View All Tasks
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
