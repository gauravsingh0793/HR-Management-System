import { EmployeeLogin } from "../pages/Employees/emplyoeelogin.jsx";
import { EmployeeDashboardLayout } from "../pages/Employees/EmployeeDashboardLayout.jsx";
import { EmployeeDashboardPage } from "../pages/Employees/EmployeeDashboardPage.jsx";
import { EmployeeNoticesPage } from "../pages/Employees/EmployeeNoticesPage.jsx";
import { EmployeeLeavesPage } from "../pages/Employees/EmployeeLeavesPage.jsx";
import { EmployeeRequestsPage } from "../pages/Employees/EmployeeRequestsPage.jsx";
import { EmployeeTasksPage } from "../pages/Employees/EmployeeTasksPage.jsx";
import { EmployeeAttendancePage } from "../pages/Employees/EmployeeAttendancePage.jsx";
import { EmployeeSalariesPage } from "../pages/Employees/EmployeeSalariesPage.jsx";
import { EmployeeProfilePage } from "../pages/Employees/EmployeeProfilePage.jsx";
import { ManagerDashboardPage } from "../pages/Employees/ManagerDashboardPage.jsx";
import { ProtectedRoutes } from "./protectedroutes.jsx";
import { ForgotPassword } from "../pages/Employees/forgotpassword.jsx";
import { ResetEmailConfirm } from "../pages/Employees/resetemailconfirm.jsx";
import { ResetPassword } from "../pages/Employees/resetpassword.jsx";
import { EntryPage } from "../pages/Employees/EntryPage.jsx";
import { EmployeeVerifyEmailPage } from "../pages/Employees/verifyemailpage.jsx";
import { EmployeeResetVerifyEmailPage } from "../pages/Employees/resetemail.jsx";
import { EmployeeSignupInfo } from "../pages/Employees/signup.jsx";
import { Navigate } from "react-router-dom";

export const EmployeeRoutes = [
  {
    path: "/",
    element: <EntryPage />,
  },
  {
    path: "/auth/employee/signup",
    element: <EmployeeSignupInfo />,
  },
  {
    path: "/auth/employee/login",
    element: <EmployeeLogin />,
  },
  {
    path: "/auth/employee/verify-email",
    element: <EmployeeVerifyEmailPage />,
  },
  {
    path: "/auth/employee/reset-email-validation",
    element: <EmployeeResetVerifyEmailPage />,
  },
  {
    path: "/auth/employee/employee-dashboard",
    element: <Navigate to="/auth/employee/dashboard" replace />,
  },
  {
    path: "/auth/employee/dashboard",
    element: (
      <ProtectedRoutes>
        <EmployeeDashboardLayout />
      </ProtectedRoutes>
    ),
    children: [
      {
        index: true,
        element: <EmployeeDashboardPage />,
      },
      {
        path: "notices",
        element: <EmployeeNoticesPage />,
      },
      {
        path: "leaves",
        element: <EmployeeLeavesPage />,
      },
      {
        path: "requests",
        element: <EmployeeRequestsPage />,
      },
      {
        path: "tasks",
        element: <EmployeeTasksPage />,
      },
      {
        path: "attendance",
        element: <EmployeeAttendancePage />,
      },
      {
        path: "salaries",
        element: <EmployeeSalariesPage />,
      },
      {
        path: "profile",
        element: <EmployeeProfilePage />,
      },
      {
        path: "manager",
        element: <ManagerDashboardPage />,
      },
    ],
  },
  {
    path: "/auth/employee/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/auth/employee/reset-email-confirmation",
    element: <ResetEmailConfirm />,
  },
  {
    path: "/auth/employee/resetpassword/:token",
    element: <ResetPassword />,
  },
];
