import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { apiService } from "@/redux/apis/APIService";
import {
  HRProfilesEndPoints,
  NotificationEndPoints,
} from "@/redux/apis/APIsEndpoints";
import {
  LayoutDashboard,
  Users,
  Building2,
  Wallet,
  Megaphone,
  CalendarDays,
  CalendarCheck,
  ClipboardList,
  Briefcase,
  FileText,
  LogOut,
  User,
} from "lucide-react";
import { HandleHRLogout } from "../../redux/Thunks/HRThunk.js";
import { NavLink as RouterNavLink } from "react-router-dom";

export function HRdashboardSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [hrName, setHrName] = useState("");
  const [hrProfileImage, setHrProfileImage] = useState("");
  const [notificationCounts, setNotificationCounts] = useState({
    leaves: 0,
    requests: 0,
    notices: 0,
  });

  const linkClass = ({ isActive }) =>
    `block rounded-xl transition-all duration-300 group relative ${
      isActive
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
        : "text-slate-700 hover:bg-slate-100 hover:text-blue-700 hover:scale-[1.01]"
    }`;

  const iconClass = ({ isActive }) =>
    `w-5 h-5 transition-all duration-300 ${
      isActive
        ? "text-white"
        : "text-slate-500 group-hover:text-blue-600 group-hover:scale-110"
    }`;
  const textClass = "text-sm font-medium";

  const onLogout = async () => {
    const result = await dispatch(HandleHRLogout());
    if (result?.payload?.success) {
      navigate("/auth/HR/login");
    }
  };

  // Fetch the current HR's name and profile image to show in the profile footer
  useEffect(() => {
    let active = true;

    const loadHRProfile = () => {
      apiService
        .get(HRProfilesEndPoints.GETALL, { withCredentials: true })
        .then((res) => {
          if (!active) return;
          const rows = Array.isArray(res.data?.data) ? res.data.data : res.data;
          const first = Array.isArray(rows) && rows.length ? rows[0] : null;
          const fullName = first
            ? `${first.firstname || ""} ${first.lastname || ""}`.trim()
            : "";
          setHrName(fullName || "");
          setHrProfileImage(first?.profileimage || "");
        })
        .catch(() => {
          if (!active) return;
          setHrName("");
          setHrProfileImage("");
        });
    };

    loadHRProfile();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadHRProfile();
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      active = false;
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);

  // Fetch notification counts
  useEffect(() => {
    let active = true;
    const fetchNotifications = () => {
      apiService
        .get(NotificationEndPoints.HR_COUNTS, { withCredentials: true })
        .then((res) => {
          if (!active) return;
          if (res.data?.success && res.data?.data) {
            setNotificationCounts(res.data.data);
          }
        })
        .catch(() => {
          if (!active) return;
        });
    };

    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Refresh notification counts when route changes
  useEffect(() => {
    const fetchNotifications = () => {
      apiService
        .get(NotificationEndPoints.HR_COUNTS, { withCredentials: true })
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setNotificationCounts(res.data.data);
          }
        })
        .catch(() => {
          // Silently handle error
        });
    };

    // Small delay to ensure mark-as-viewed has completed
    const timer = setTimeout(fetchNotifications, 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <Sidebar>
      <SidebarContent>
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200/50 -mx-2 px-3 py-3 mb-2 animate-fade-in-down">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 via-emerald-500 to-indigo-500 text-white font-semibold flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
              HN
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold text-slate-900">HR Nexus</p>
            </div>
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 p-2">
              <NavLink
                to="/auth/HR/dashboard/dashboard-data"
                end
                className={linkClass}
              >
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5">
                    <LayoutDashboard className={iconClass({ isActive })} />
                    <span className={textClass}>
                      {isActive ? "Dashboard" : "Dashboard"}
                    </span>
                  </SidebarMenuItem>
                )}
              </NavLink>

              <NavLink to="/auth/HR/dashboard/employees" className={linkClass}>
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5">
                    <Users className={iconClass({ isActive })} />
                    <span className={textClass}>Employees</span>
                  </SidebarMenuItem>
                )}
              </NavLink>

              <NavLink
                to="/auth/HR/dashboard/departments"
                className={linkClass}
              >
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5">
                    <Building2 className={iconClass({ isActive })} />
                    <span className={textClass}>Departments</span>
                  </SidebarMenuItem>
                )}
              </NavLink>

              <NavLink to="/auth/HR/dashboard/salaries" className={linkClass}>
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5">
                    <Wallet className={iconClass({ isActive })} />
                    <span className={textClass}>Salaries</span>
                  </SidebarMenuItem>
                )}
              </NavLink>

              <NavLink to="/auth/HR/dashboard/notices" className={linkClass}>
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5 relative">
                    <Megaphone className={iconClass({ isActive })} />
                    <span className={textClass}>Issue Notices</span>
                    {notificationCounts.notices > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                        {notificationCounts.notices > 9
                          ? "9+"
                          : notificationCounts.notices}
                      </span>
                    )}
                  </SidebarMenuItem>
                )}
              </NavLink>

              <NavLink to="/auth/HR/dashboard/leaves" className={linkClass}>
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5 relative">
                    <CalendarDays className={iconClass({ isActive })} />
                    <span className={textClass}>Leaves</span>
                    {notificationCounts.leaves > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                        {notificationCounts.leaves > 9
                          ? "9+"
                          : notificationCounts.leaves}
                      </span>
                    )}
                  </SidebarMenuItem>
                )}
              </NavLink>

              <NavLink to="/auth/HR/dashboard/attendance" className={linkClass}>
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5">
                    <CalendarCheck className={iconClass({ isActive })} />
                    <span className={textClass}>Attendances</span>
                  </SidebarMenuItem>
                )}
              </NavLink>

              <NavLink
                to="/auth/HR/dashboard/recruitment"
                className={linkClass}
              >
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5">
                    <Briefcase className={iconClass({ isActive })} />
                    <span className={textClass}>Recruitment</span>
                  </SidebarMenuItem>
                )}
              </NavLink>

              <NavLink
                to="/auth/HR/dashboard/interview-insights"
                className={linkClass}
              >
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5">
                    <FileText className={iconClass({ isActive })} />
                    <span className={textClass}>Interview Insights</span>
                  </SidebarMenuItem>
                )}
              </NavLink>

              <NavLink to="/auth/HR/dashboard/requests" className={linkClass}>
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5 relative">
                    <ClipboardList className={iconClass({ isActive })} />
                    <span className={textClass}>Requests</span>
                    {notificationCounts.requests > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                        {notificationCounts.requests > 9
                          ? "9+"
                          : notificationCounts.requests}
                      </span>
                    )}
                  </SidebarMenuItem>
                )}
              </NavLink>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="p-3 space-y-3 overflow-hidden">
          <RouterNavLink
            to="/auth/HR/dashboard/profiles"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {hrProfileImage ? (
              <img
                src={hrProfileImage}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {hrName || "HR Profile"}
              </p>
              <p className="text-xs text-slate-600 truncate">
                Manage your details
              </p>
            </div>
          </RouterNavLink>
          <button
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2.5 px-4 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg hover-lift"
            onClick={onLogout}
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
            <span>Logout</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
