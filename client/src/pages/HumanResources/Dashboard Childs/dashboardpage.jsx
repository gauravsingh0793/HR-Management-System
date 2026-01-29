import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarClock,
  DollarSign,
  FilePlus2,
  Globe2,
  ShieldCheck,
  Users,
  Workflow,
  Loader2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Star } from "lucide-react";
import { HandleGetDashboard } from "@/redux/Thunks/DashboardThunk";
import { useToast } from "@/hooks/use-toast";

const quickActions = [
  { label: "Add employee", icon: Users, route: "/auth/HR/dashboard/employees" },
  {
    label: "Create requisition",
    icon: FilePlus2,
    route: "/auth/HR/dashboard/recruitment",
  },
  {
    label: "Publish notice",
    icon: Globe2,
    route: "/auth/HR/dashboard/notices",
  },
  {
    label: "Run payroll check",
    icon: ShieldCheck,
    route: "/auth/HR/dashboard/salaries",
  },
];

export const HRDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dashboardState = useSelector((state) => state.dashboardreducer);

  // Fetch dashboard data on mount
  useEffect(() => {
    dispatch(HandleGetDashboard({ apiroute: "GETDATA" }));
  }, [dispatch]);

  // Auto-refresh dashboard data every 60 seconds to keep attendance updated
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(HandleGetDashboard({ apiroute: "GETDATA" }));
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  // Show error toast if fetch fails
  useEffect(() => {
    if (dashboardState.error?.status) {
      toast({
        variant: "destructive",
        title: "Failed to load dashboard data",
        description:
          dashboardState.error?.message || "Please try refreshing the page",
      });
    }
  }, [dashboardState.error, toast]);

  // Process dashboard data
  const dashboardData = useMemo(() => {
    return dashboardState.data || {};
  }, [dashboardState.data]);
  const isLoading = dashboardState.isLoading;

  // Employee attendance status for today
  const employeeAttendanceStatus = useMemo(() => {
    return dashboardData.employeeAttendanceStatus || [];
  }, [dashboardData.employeeAttendanceStatus]);

  // Count active employees (checked in today)
  const activeEmployeesToday = useMemo(() => {
    return employeeAttendanceStatus.filter((emp) => emp.status === "Active")
      .length;
  }, [employeeAttendanceStatus]);

  const totalEmployees = useMemo(() => {
    return dashboardData.employees || 0;
  }, [dashboardData.employees]);

  // Get real interview insights data from backend
  const interviewFunnelData = useMemo(() => {
    const stats = dashboardData.interviewStats;
    if (!stats) {
      return [
        { stage: "Total", count: 0 },
        { stage: "Pending", count: 0 },
        { stage: "Completed", count: 0 },
        { stage: "Cancelled", count: 0 },
      ];
    }
    return [
      { stage: "Total", count: stats.total || 0 },
      { stage: "Pending", count: stats.pending || 0 },
      { stage: "Completed", count: stats.completed || 0 },
      { stage: "Cancelled", count: stats.cancelled || 0 },
    ];
  }, [dashboardData.interviewStats]);

  // Get real employee analytics data from backend
  const headcountTrend = useMemo(() => {
    return (
      dashboardData.employeeAnalytics || [
        { month: "Jan", headcount: 0, hires: 0, attrition: 0 },
        { month: "Feb", headcount: 0, hires: 0, attrition: 0 },
        { month: "Mar", headcount: 0, hires: 0, attrition: 0 },
        { month: "Apr", headcount: 0, hires: 0, attrition: 0 },
        { month: "May", headcount: 0, hires: 0, attrition: 0 },
        { month: "Jun", headcount: 0, hires: 0, attrition: 0 },
        { month: "Jul", headcount: 0, hires: 0, attrition: 0 },
        { month: "Aug", headcount: 0, hires: 0, attrition: 0 },
      ]
    );
  }, [dashboardData.employeeAnalytics]);
  // Get real attendance data from backend
  const attendanceByTeam = useMemo(() => {
    return (
      dashboardData.attendanceByDepartment || [
        { team: "No data", present: 0, late: 0 },
      ]
    );
  }, [dashboardData.attendanceByDepartment]);

  // Employees per department for pie chart
  const employeesByDepartment = useMemo(() => {
    const raw = dashboardData.employeeDistributionByDepartment || [];

    console.log("Raw department data:", raw);

    const cleaned = raw
      .map((item) => ({
        name: item.name || "Unnamed Department",
        count: item.count || 0,
      }))
      .filter((item) => item.count > 0);

    console.log("Cleaned department data:", cleaned);

    if (!cleaned.length) {
      return [{ name: "No data", count: 1 }];
    }

    return cleaned;
  }, [dashboardData.employeeDistributionByDepartment]);
  const totalEmployeesInDepartments = useMemo(
    () => employeesByDepartment.reduce((sum, item) => sum + item.count, 0),
    [employeesByDepartment],
  );
  const departmentColors = [
    "hsl(217 71% 53%)",
    "hsl(160 84% 39%)",
    "hsl(43 96% 56%)",
    "hsl(0 84% 63%)",
    "hsl(280 75% 60%)",
    "hsl(24 95% 53%)",
  ];
  // Calculate payroll stats from real salary data
  const payrollSnapshot = useMemo(() => {
    const salaryStats = dashboardData.salaryStats || {};
    const balance = dashboardData.balance || [];
    const availableAmount = balance.reduce(
      (sum, b) => sum + (b.availableamount || 0),
      0,
    );

    // Format currency helper for Indian Rupees with k/L notation
    const formatCurrency = (amount) => {
      if (amount >= 10000000) {
        // 1 crore or more
        return `₹${(amount / 10000000).toFixed(1)}Cr`;
      } else if (amount >= 100000) {
        // 1 lakh or more
        return `₹${(amount / 100000).toFixed(1)}L`;
      } else if (amount >= 1000) {
        // 1 thousand or more
        return `₹${(amount / 1000).toFixed(1)}k`;
      } else {
        return `₹${amount.toFixed(0)}`;
      }
    };

    return [
      {
        label: "Total paid",
        value: formatCurrency(salaryStats.totalPaid || 0),
      },
      {
        label: "Pending payment",
        value: formatCurrency(salaryStats.totalPending || 0),
      },
      {
        label: "Delayed payment",
        value: formatCurrency(salaryStats.totalDelayed || 0),
      },
      { label: "Available balance", value: formatCurrency(availableAmount) },
    ];
  }, [dashboardData]);

  // Organization-wide performance metrics from manager reviews
  const performanceMetrics = dashboardData.performanceMetrics || {};
  const performancePercent = useMemo(() => {
    const score = performanceMetrics.overallAverageReviewScore;
    if (typeof score === "number" && score > 0) {
      // Map 1-5 score to 0-100% so that 1 => 0%, 5 => 100%
      const normalized = ((score - 1) / 4) * 100;
      return Math.round(Math.min(Math.max(normalized, 0), 100));
    }
    return null;
  }, [performanceMetrics.overallAverageReviewScore]);
  const performanceMonthlyTrend = useMemo(() => {
    const trend = performanceMetrics.monthlyTrend || [];
    // Ensure we always have 6 months worth of labels, even if no data
    if (!trend.length) {
      return [
        { month: "Jan", averageScore: null, reviewCount: 0 },
        { month: "Feb", averageScore: null, reviewCount: 0 },
        { month: "Mar", averageScore: null, reviewCount: 0 },
        { month: "Apr", averageScore: null, reviewCount: 0 },
        { month: "May", averageScore: null, reviewCount: 0 },
        { month: "Jun", averageScore: null, reviewCount: 0 },
      ];
    }
    return trend;
  }, [performanceMetrics.monthlyTrend]);

  // Process notifications from real notices data
  const notifications = useMemo(() => {
    const notices = dashboardData.notices || [];
    return notices.slice(0, 3).map((notice) => ({
      title: notice.title || "Notice",
      detail: notice.content || notice.description || "No description",
      createdBy: notice.createdby
        ? `${notice.createdby.firstname || ""} ${
            notice.createdby.lastname || ""
          }`.trim()
        : "HR",
      date: notice.createdAt,
    }));
  }, [dashboardData.notices]);

  // Summary cards with real data
  const summaryCards = useMemo(
    () => [
      {
        title: "Total employees",
        value: totalEmployees.toString(),
        delta: `${activeEmployeesToday} checked in today`,
        icon: Users,
        route: "/auth/HR/dashboard/employees",
      },
      {
        title: "Departments",
        value: dashboardData.departments?.toString() || "0",
        delta: "Organizational units",
        icon: Workflow,
        route: "/auth/HR/dashboard/departments",
      },
      {
        title: "Leave requests",
        value: dashboardData.leaves?.toString() || "0",
        delta: "Pending approvals",
        icon: CalendarClock,
        route: "/auth/HR/dashboard/leaves",
      },
      {
        title: "Active requests",
        value: dashboardData.requestes?.toString() || "0",
        delta: "Require attention",
        icon: FilePlus2,
        route: "/auth/HR/dashboard/requests",
      },
    ],
    [dashboardData, totalEmployees, activeEmployeesToday],
  );

  const handleQuickAction = (route) => {
    navigate(route);
  };

  const handleCardClick = (route) => {
    if (route) {
      navigate(route);
    }
  };

  const handleExport = () => {
    toast({
      title: "Export feature",
      description: "Export functionality will be available soon",
    });
  };

  const handlePayrollCheck = () => {
    navigate("/auth/HR/dashboard/salaries");
    toast({
      title: "Navigating to payroll",
      description: "Review salary records and payroll details",
    });
  };

  return (
    <div className="grid gap-6 animate-fade-in-up">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-slate-600">Loading dashboard data...</span>
        </div>
      )}

      {/* Error State */}
      {!isLoading && dashboardState.error?.status && (
        <Card className="frosted-card border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">
                Failed to load dashboard
              </p>
              <p className="text-sm text-red-700">
                {dashboardState.error?.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Distribution - Prominent Pie Chart */}
      <Card className="frosted-card border-transparent shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">
            Employees by Department
          </CardTitle>
          <CardDescription className="text-base">
            Total employee distribution across {employeesByDepartment.length}{" "}
            department{employeesByDepartment.length !== 1 ? "s" : ""} (
            {totalEmployeesInDepartments} employees)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-6 lg:grid-cols-2 items-center">
            {/* Pie Chart */}
            <div className="flex items-center justify-center">
              <ChartContainer config={{}} className="h-[350px] w-full">
                <PieChart>
                  <Pie
                    data={employeesByDepartment}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    paddingAngle={2}
                    label={({ percent }) =>
                      `${Math.round((percent || 0) * 100)}%`
                    }
                    labelLine={{ stroke: "#64748b", strokeWidth: 1 }}
                  >
                    {employeesByDepartment.map((entry, index) => {
                      const color =
                        departmentColors[index % departmentColors.length];
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percentage = totalEmployeesInDepartments
                          ? Math.round(
                              (data.count / totalEmployeesInDepartments) * 100,
                            )
                          : 0;
                        return (
                          <div className="rounded-lg border bg-white p-3 shadow-lg text-sm">
                            <p className="font-semibold text-slate-900 mb-1">
                              {data.name}
                            </p>
                            <p className="text-slate-600">
                              Employees: {data.count} ({percentage}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ChartContainer>
            </div>

            {/* Department Legend */}
            <div className="space-y-2">
              {employeesByDepartment.map((dept, index) => {
                const percentage = totalEmployeesInDepartments
                  ? Math.round((dept.count / totalEmployeesInDepartments) * 100)
                  : 0;
                const color = departmentColors[index % departmentColors.length];
                return (
                  <div
                    key={dept.name + index}
                    className="flex items-center justify-between rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-4 w-4 rounded-full shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-slate-800 font-medium">
                        {dept.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 text-sm">
                        {dept.count} employee{dept.count !== 1 ? "s" : ""}
                      </span>
                      <span className="text-blue-600 font-semibold text-sm">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card
            key={item.title}
            className="frosted-card border-transparent shadow-lg hover-lift cursor-pointer transition-all duration-300 animate-scale-in"
            onClick={() => handleCardClick(item.route)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex-1">
                <CardDescription className="text-sm text-slate-500">
                  {item.title}
                </CardDescription>
                <CardTitle className="text-2xl font-semibold text-slate-900">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  ) : (
                    item.value
                  )}
                </CardTitle>
              </div>
              <item.icon className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/15 via-emerald-400/15 to-indigo-500/15 p-2 text-blue-600 shadow-[0_10px_30px_rgba(59,130,246,0.15)] flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {item.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="frosted-card border-transparent shadow-xl xl:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Employee analytics</CardTitle>
                <CardDescription>
                  Headcount momentum with hires vs attrition
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="hover-lift"
              >
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer
              config={{
                headcount: { label: "Headcount", color: "hsl(217 71% 53%)" },
                hires: { label: "Hires", color: "hsl(160 84% 39%)" },
                attrition: { label: "Attrition", color: "hsl(0 84% 63%)" },
              }}
              className="aspect-[16/7]"
            >
              <LineChart
                data={headcountTrend}
                margin={{ left: 12, right: 12, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200"
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={40}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="headcount"
                  stroke="hsl(217 71% 53%)"
                  fill="url(#headcount-fill)"
                  strokeWidth={2.4}
                  name="Headcount"
                />
                <Line
                  type="monotone"
                  dataKey="hires"
                  stroke="hsl(160 84% 39%)"
                  strokeWidth={2.4}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Hires"
                />
                <Line
                  type="monotone"
                  dataKey="attrition"
                  stroke="hsl(0 84% 63%)"
                  strokeWidth={2.4}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Attrition"
                />
                <defs>
                  <linearGradient
                    id="headcount-fill"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(217 71% 53%)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(217 71% 53%)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="frosted-card border-transparent shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Interview Insights</CardTitle>
            <CardDescription>Interview status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer
              config={{
                funnel: { label: "Interviews", color: "hsl(217 71% 53%)" },
              }}
              className="aspect-[4/5]"
            >
              <BarChart
                data={interviewFunnelData}
                layout="vertical"
                margin={{ left: 16, right: 16 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  className="stroke-slate-200"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="stage"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <Bar
                  dataKey="count"
                  radius={[8, 8, 8, 8]}
                  fill="hsl(217 71% 53%)"
                />
              </BarChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Pending</p>
                <p className="font-semibold text-slate-900">
                  {dashboardData.interviewStats?.pending || 0}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Completed</p>
                <p className="font-semibold text-slate-900">
                  {dashboardData.interviewStats?.completed || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance overview from manager reviews */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="frosted-card border-transparent shadow-md lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Performance snapshot
            </CardTitle>
            <CardDescription className="text-xs">
              Average review scores across your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-3 text-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {performancePercent !== null ? `${performancePercent}%` : "-"}
              </span>
              {typeof performanceMetrics.overallAverageReviewScore ===
                "number" && (
                <span className="text-xs text-slate-500">
                  ({performanceMetrics.overallAverageReviewScore.toFixed(2)} /
                  5.0)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Based on {performanceMetrics.totalReviews || 0} manager review
              {performanceMetrics.totalReviews === 1 ? "" : "s"}.
            </p>
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-800 flex items-start gap-2">
              <AlertCircle className="w-3 h-3 mt-0.5" />
              <span>
                Use this as a high-level signal only. For detailed insights,
                open an employee profile or the manager panel.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="frosted-card border-transparent shadow-md lg:col-span-2">
          <CardHeader className="pb-2 flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-600" />
                Monthly performance trend
              </CardTitle>
              <CardDescription className="text-xs">
                Average overall review score for the last 6 months
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <ChartContainer
              config={{
                score: {
                  label: "Average score",
                  color: "hsl(43 96% 56%)",
                },
              }}
              className="h-[220px] w-full"
            >
              <LineChart data={performanceMonthlyTrend} margin={{ left: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  domain={[1, 5]}
                  tick={{ fontSize: 11 }}
                  allowDecimals
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => `Month: ${label}`}
                      formatter={(value) =>
                        value == null ? "No data" : `${value} / 5`
                      }
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="averageScore"
                  stroke="hsl(43 96% 56%)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="frosted-card border-transparent shadow-xl lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Attendance overview</CardTitle>
            <CardDescription>
              Presence and late arrivals by team -{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer
              config={{
                present: { label: "Present", color: "hsl(160 84% 39%)" },
                late: { label: "Late", color: "hsl(43 96% 56%)" },
              }}
              className="aspect-[16/6]"
            >
              <BarChart
                data={attendanceByTeam}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200"
                />
                <XAxis
                  dataKey="team"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={36}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-white p-3 shadow-lg">
                          <p className="font-semibold text-slate-900 mb-2">
                            {data.fullName}
                          </p>
                          {payload.map((entry, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-slate-600">
                                {entry.name}:
                              </span>
                              <span className="font-medium text-slate-900">
                                {entry.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="present"
                  fill="hsl(160 84% 39%)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="late"
                  fill="hsl(43 96% 56%)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="frosted-card border-transparent shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Payroll snapshot</CardTitle>
            <CardDescription>This cycle at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              payrollSnapshot.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm hover:bg-slate-100 transition-colors duration-200"
                >
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-semibold text-slate-900">
                    {row.value}
                  </span>
                </div>
              ))
            )}
            <Button
              className="w-full hover-lift"
              variant="default"
              onClick={handlePayrollCheck}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Run payroll health check
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Employee Active/Inactive Status Table */}
      <Card className="frosted-card border-transparent shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Employee Status Today</CardTitle>
          <CardDescription>
            Shows if employees are{" "}
            <span className="text-emerald-600 font-semibold">Active</span>{" "}
            (attendance marked) or{" "}
            <span className="text-red-500 font-semibold">Inactive</span> (not
            marked) for today.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {employeeAttendanceStatus.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-center text-slate-400"
                    >
                      No employee data
                    </td>
                  </tr>
                ) : (
                  employeeAttendanceStatus.map((emp) => (
                    <tr key={emp._id}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {emp.firstname} {emp.lastname}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {emp.email}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {emp.status === "Active" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="frosted-card border-transparent shadow-xl lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Notifications</CardTitle>
            <CardDescription>Recent HR events and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {notifications.length > 0 ? (
              notifications.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
                  onClick={() => navigate("/auth/HR/dashboard/notices")}
                >
                  <span
                    className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.18)] animate-pulse"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {item.detail}
                    </p>
                    {item.createdBy && (
                      <p className="text-xs text-slate-500 mt-1">
                        By {item.createdBy}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No recent notifications</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate("/auth/HR/dashboard/notices")}
                >
                  View all notices
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="frosted-card border-transparent shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Quick actions</CardTitle>
            <CardDescription>Move faster with shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="justify-start gap-3 hover-lift w-full"
                onClick={() => handleQuickAction(action.route)}
              >
                <action.icon className="h-4 w-4 text-blue-600" />
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
