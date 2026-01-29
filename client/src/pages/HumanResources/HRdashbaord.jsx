import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HRdashboardSidebar } from "../../components/ui/HRsidebar.jsx";
import { Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";

export const HRDashbaord = () => {
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const path = location.pathname || "";
    if (path.endsWith("/dashboard") || path.endsWith("/dashboard/")) return "Dashboard";
    if (path.includes("/dashboard-data")) return "Dashboard";
    if (path.includes("/employees")) return "Employees";
    if (path.includes("/departments")) return "Departments";
    if (path.includes("/salaries")) return "Salaries";
    if (path.includes("/notices")) return "Notices";
    if (path.includes("/leaves")) return "Leaves";
    if (path.includes("/attendance")) return "Attendance";
    if (path.includes("/recruitment")) return "Recruitment";
    if (path.includes("/interview-insights")) return "Interview Insights";
    if (path.includes("/requests")) return "Requests";
    if (path.includes("/profiles")) return "HR Profiles";
    return "Dashboard";
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <div className="HR-dashboard-container app-shell flex w-full min-h-screen text-[15px] leading-6 text-slate-800">
        <div className="HRDashboard-sidebar flex-shrink-0">
          <HRdashboardSidebar />
        </div>
        <div className="HRdashboard-container relative flex-1 min-w-0 flex flex-col">
          <header className="glass-header sticky top-0 z-20 border-b px-5 py-4 flex items-center justify-between gap-3 rounded-b-xl">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="text-lg font-semibold text-slate-900">{pageTitle}</div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.18)] animate-pulse" aria-hidden="true" />
              <span>Live workspace</span>
            </div>
          </header>
          <div className="app-content flex-1 overflow-auto">
            <div className="frosted-card rounded-2xl p-4 md:p-6 min-h-full">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};
