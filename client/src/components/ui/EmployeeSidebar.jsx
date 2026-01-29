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
import { HandleEmployeeLogout } from "../../redux/Thunks/EmployeeThunk.js";
import { useEffect, useState, useCallback } from "react";
import { apiService } from "@/redux/apis/APIService";
import {
  EmployeeProfileEndPoints,
  NotificationEndPoints,
} from "@/redux/apis/APIsEndpoints";
import {
  LogOut,
  User,
  LayoutDashboard,
  Megaphone,
  CalendarDays,
  ClipboardList,
  CalendarCheck,
  Wallet,
  ListTodo,
} from "lucide-react";

export function EmployeeSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationCounts, setNotificationCounts] = useState({
    leaves: 0,
    requests: 0,
    notices: 0,
  });

  const loadProfile = useCallback(async () => {
    try {
      const res = await apiService.get(EmployeeProfileEndPoints.GET, {
        withCredentials: true,
      });
      const data = res.data?.data;
      if (data) {
        setEmployee(data);
      }
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      console.log(
        "Employee sidebar - profileUpdated event received, reloading...",
      );
      loadProfile();
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [loadProfile]);

  // Fetch notification counts
  useEffect(() => {
    let active = true;
    const fetchNotifications = () => {
      apiService
        .get(NotificationEndPoints.EMPLOYEE_COUNTS, { withCredentials: true })
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
        .get(NotificationEndPoints.EMPLOYEE_COUNTS, { withCredentials: true })
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

  const onLogout = async () => {
    const result = await dispatch(HandleEmployeeLogout());
    if (result?.payload?.success) {
      navigate("/auth/employee/login");
    }
  };

  const getInitials = (firstname, lastname) => {
    const first = firstname?.charAt(0)?.toUpperCase() || "";
    const last = lastname?.charAt(0)?.toUpperCase() || "";
    return `${first}${last}` || "U";
  };

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
              <p className="text-xs text-slate-500">Employee Workspace</p>
            </div>
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 p-2">
              <NavLink
                to={"/auth/employee/dashboard"}
                end
                className={({ isActive }) =>
                  `block rounded-xl transition-all duration-300 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                      : "text-slate-700 hover:bg-slate-100 hover:text-blue-700 hover:scale-[1.01]"
                  }`
                }
              >
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5">
                    <LayoutDashboard
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-blue-600 group-hover:scale-110"
                      }`}
                    />
                    <span className="text-sm font-medium">Dashboard</span>
                  </SidebarMenuItem>
                )}
              </NavLink>

              {/* Manager-only: simple link to manage team tasks & reviews */}
              {employee?.role === "Manager" && (
                <NavLink
                  to={"/auth/employee/dashboard/manager"}
                  className={({ isActive }) =>
                    `block rounded-xl transition-all duration-300 group relative ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                        : "text-slate-700 hover:bg-slate-100 hover:text-blue-700 hover:scale-[1.01]"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5">
                      <ClipboardList
                        className={`w-5 h-5 transition-all duration-300 ${
                          isActive
                            ? "text-white"
                            : "text-slate-500 group-hover:text-blue-600 group-hover:scale-110"
                        }`}
                      />
                      <span className="text-sm font-medium">Manager Panel</span>
                    </SidebarMenuItem>
                  )}
                </NavLink>
              )}

              <NavLink
                to={"/auth/employee/dashboard/tasks"}
                className={({ isActive }) =>
                  `block rounded-xl transition-all duration-300 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                      : "text-slate-700 hover:bg-slate-100 hover:text-blue-700 hover:scale-[1.01]"
                  }`
                }
              >
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5">
                    <ListTodo
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-blue-600 group-hover:scale-110"
                      }`}
                    />
                    <span className="text-sm font-medium">My Tasks</span>
                  </SidebarMenuItem>
                )}
              </NavLink>

              <NavLink
                to={"/auth/employee/dashboard/notices"}
                className={({ isActive }) =>
                  `block rounded-xl transition-all duration-300 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                      : "text-slate-700 hover:bg-slate-100 hover:text-blue-700 hover:scale-[1.01]"
                  }`
                }
              >
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5 relative">
                    <Megaphone
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-blue-600 group-hover:scale-110"
                      }`}
                    />
                    <span className="text-sm font-medium">Notices</span>
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

              <NavLink
                to={"/auth/employee/dashboard/leaves"}
                className={({ isActive }) =>
                  `block rounded-xl transition-all duration-300 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                      : "text-slate-700 hover:bg-slate-100 hover:text-blue-700 hover:scale-[1.01]"
                  }`
                }
              >
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5 relative">
                    <CalendarDays
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-blue-600 group-hover:scale-110"
                      }`}
                    />
                    <span className="text-sm font-medium">My Leaves</span>
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

              <NavLink
                to={"/auth/employee/dashboard/requests"}
                className={({ isActive }) =>
                  `block rounded-xl transition-all duration-300 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                      : "text-slate-700 hover:bg-slate-100 hover:text-blue-700 hover:scale-[1.01]"
                  }`
                }
              >
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5 relative">
                    <ClipboardList
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-blue-600 group-hover:scale-110"
                      }`}
                    />
                    <span className="text-sm font-medium">My Requests</span>
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

              <NavLink
                to={"/auth/employee/dashboard/attendance"}
                className={({ isActive }) =>
                  `block rounded-xl transition-all duration-300 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                      : "text-slate-700 hover:bg-slate-100 hover:text-blue-700 hover:scale-[1.01]"
                  }`
                }
              >
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5">
                    <CalendarCheck
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-blue-600 group-hover:scale-110"
                      }`}
                    />
                    <span className="text-sm font-medium">Attendance</span>
                  </SidebarMenuItem>
                )}
              </NavLink>

              <NavLink
                to={"/auth/employee/dashboard/salaries"}
                className={({ isActive }) =>
                  `block rounded-xl transition-all duration-300 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                      : "text-slate-700 hover:bg-slate-100 hover:text-blue-700 hover:scale-[1.01]"
                  }`
                }
              >
                {({ isActive }) => (
                  <SidebarMenuItem className="group flex items-center gap-3 px-4 py-2.5">
                    <Wallet
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-blue-600 group-hover:scale-110"
                      }`}
                    />
                    <span className="text-sm font-medium">Salaries</span>
                  </SidebarMenuItem>
                )}
              </NavLink>

              {/* Profile Link */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="p-3 space-y-3 overflow-hidden">
          <NavLink
            to={"/auth/employee/dashboard/profile"}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {(() => {
              console.log("Employee sidebar render - employee:", employee);
              console.log(
                "Employee sidebar render - profileimage:",
                employee?.profileimage,
              );
              return employee?.profileimage ? (
                <img
                  src={employee.profileimage}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {loading ? (
                    <User className="w-5 h-5" />
                  ) : (
                    getInitials(employee?.firstname, employee?.lastname)
                  )}
                </div>
              );
            })()}
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {loading
                  ? "Loading..."
                  : employee
                    ? `${employee.firstname} ${employee.lastname}`
                    : "Employee"}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {loading ? "" : employee?.email || ""}
              </p>
            </div>
          </NavLink>

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
