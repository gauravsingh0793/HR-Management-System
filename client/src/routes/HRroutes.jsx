import { HRSignupPage } from "../pages/HumanResources/HRSignup";
import { HRLogin } from "../pages/HumanResources/HRlogin";
import { HRDashbaord } from "../pages/HumanResources/HRdashbaord";
import { Navigate } from "react-router-dom";
import { VerifyEmailPage } from "../pages/HumanResources/verifyemailpage.jsx";
// import { ResetEmailConfirm } from "../pages/Employees/resetemailconfirm.jsx"
// import { ResetEmailVerification } from "../pages/HumanResources/resendemailverificaiton.jsx"
import { HRForgotPasswordPage } from "../pages/HumanResources/forgotpassword.jsx";
import { ResetMailConfirmPage } from "../pages/HumanResources/resetmailconfirm.jsx";
import { ResetHRPasswordPage } from "../pages/HumanResources/resetpassword.jsx";
import { ResetHRVerifyEmailPage } from "../pages/HumanResources/resetemail.jsx";
import { HRDashboardPage } from "../pages/HumanResources/Dashboard Childs/dashboardpage.jsx";
import { HRProtectedRoutes } from "./HRprotectedroutes.jsx";
import { HREmployeesPage } from "../pages/HumanResources/Dashboard Childs/employeespage.jsx";
import { HRDepartmentPage } from "../pages/HumanResources/Dashboard Childs/departmentpage.jsx";
import { HRLeavesPage } from "../pages/HumanResources/Dashboard Childs/leavespage.jsx";
import { HRRequestesPage } from "../pages/HumanResources/Dashboard Childs/requestespage.jsx";
import { HRAttendancePage } from "../pages/HumanResources/Dashboard Childs/attendancepage.jsx";
import { HRRecruitmentPage } from "../pages/HumanResources/Dashboard Childs/recruitmentpage.jsx";
import { HRInterviewInsightsPage } from "../pages/HumanResources/Dashboard Childs/interviewpage.jsx";
import { HRSalariesPage } from "../pages/HumanResources/Dashboard Childs/salariespage.jsx";
import { HRNoticesPage } from "../pages/HumanResources/Dashboard Childs/noticespage.jsx";
import { HRProfilesPage } from "../pages/HumanResources/Dashboard Childs/profilespage.jsx";
export const HRRoutes = [
  // Legacy alias to support old links
  {
    path: "/HR/dashboard",
    element: <Navigate to="/auth/HR/dashboard" replace />,
  },
  {
    path: "/auth/HR/signup",
    element: <HRSignupPage />,
  },
  {
    path: "/auth/HR/login",
    element: <HRLogin />,
  },
  {
    path: "/auth/HR/dashboard",
    element: (
      <HRProtectedRoutes>
        <HRDashbaord />
      </HRProtectedRoutes>
    ),
    children: [
      {
        index: true,
        element: <HRDashboardPage />,
      },
      {
        path: "dashboard-data",
        element: <HRDashboardPage />,
      },
      {
        path: "employees",
        element: <HREmployeesPage />,
      },
      {
        path: "departments",
        element: <HRDepartmentPage />,
      },
      {
        path: "leaves",
        element: <HRLeavesPage />,
      },
      {
        path: "requestes",
        element: <HRRequestesPage />,
      },
      {
        path: "requests",
        element: <HRRequestesPage />,
      },
      {
        path: "attendance",
        element: <HRAttendancePage />,
      },
      {
        path: "recruitment",
        element: <HRRecruitmentPage />,
      },
      {
        path: "interview-insights",
        element: <HRInterviewInsightsPage />,
      },
      {
        path: "salaries",
        element: <HRSalariesPage />,
      },
      {
        path: "notices",
        element: <HRNoticesPage />,
      },
      {
        path: "profiles",
        element: <HRProfilesPage />,
      },
    ],
  },
  {
    path: "/auth/HR/verify-email",
    element: <VerifyEmailPage />,
  },
  {
    path: "/auth/HR/reset-email-validation",
    element: <ResetHRVerifyEmailPage />,
  },
  {
    path: "/auth/HR/forgot-password",
    element: <HRForgotPasswordPage />,
  },
  {
    path: "/auth/HR/reset-email-confirmation",
    element: <ResetMailConfirmPage />,
  },
  {
    path: "/auth/HR/resetpassword/:token",
    element: <ResetHRPasswordPage />,
  },
];
