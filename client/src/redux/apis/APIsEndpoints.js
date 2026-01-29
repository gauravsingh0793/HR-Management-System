export const APIsEndPoints = {
  LOGIN: "/api/auth/employee/login",
  CHECKELOGIN: "/api/auth/employee/check-login",
  LOGOUT: "/api/auth/employee/logout",
  FORGOT_PASSWORD: "/api/auth/employee/forgot-password",
  RESET_PASSWORD: (token) => `/api/auth/employee/reset-password/${token}`,
  VERIFY_EMAIL: "/api/auth/employee/verify-email",
  CHECK_VERIFY_EMAIL: "/api/auth/employee/check-verify-email",
  RESEND_VERIFY_EMAIL: "/api/auth/employee/resend-verify-email",
};

export const HREndPoints = {
  SIGNUP: "/api/auth/HR/signup",
  CHECKLOGIN: "/api/auth/HR/check-login",
  LOGIN: "/api/auth/HR/login",
  LOGOUT: "/api/auth/HR/logout",
  VERIFY_EMAIL: "/api/auth/HR/verify-email",
  CHECK_VERIFY_EMAIL: "/api/auth/HR/check-verify-email",
  RESEND_VERIFY_EMAIL: "/api/auth/HR/resend-verify-email",
  FORGOT_PASSWORD: "/api/auth/HR/forgot-password",
  RESET_PASSWORD: (token) => `/api/auth/HR/reset-password/${token}`,
};

export const DashboardEndPoints = {
  GETDATA: "/api/v1/dashboard/HR-dashboard",
};

export const HREmployeesPageEndPoints = {
  GETALL: "/api/v1/employee/all",
  ADDEMPLOYEE: "/api/auth/employee/signup",
  GETONE: (EMID) => `/api/v1/employee/by-HR/${EMID}`,
  DELETE: (EMID) => `/api/v1/employee/delete-employee/${EMID}`,
  UPDATE_BY_HR: "/api/v1/employee/update-employee-by-HR",
};

export const HRDepartmentPageEndPoints = {
  GETALL: "/api/v1/department/all",
  CREATE: "/api/v1/department/create-department",
  UPDATE: "/api/v1/department/update-department",
  DELETE: "/api/v1/department/delete-department",
};

export const EmployeesIDsEndPoints = {
  GETALL: "/api/v1/employee/all-employees-ids",
};

// HR Feature Pages
export const HRAttendanceEndPoints = {
  GETALL: "/api/v1/attendance/all",
};

export const HRLeavesEndPoints = {
  GETALL: "/api/v1/leave/all",
  UPDATE_STATUS: "/api/v1/leave/HR-update-leave",
};

export const HRRecruitmentEndPoints = {
  GETALL: "/api/v1/recruitment/all",
  CREATE: "/api/v1/recruitment/create-recruitment",
  UPDATE: "/api/v1/recruitment/update-recruitment",
};

export const HRInterviewEndPoints = {
  GETALL: "/api/v1/interview-insights/all",
  CREATE: "/api/v1/interview-insights/create-interview",
  BULK_CREATE: "/api/v1/interview-insights/create-interview/bulk",
  UPDATE: "/api/v1/interview-insights/update-interview",
};

export const HRSalaryEndPoints = {
  GETALL: "/api/v1/salary/all",
  CREATE: "/api/v1/salary/create-salary",
  UPDATE: "/api/v1/salary/update-salary",
};

export const HRNoticeEndPoints = {
  GETALL: "/api/v1/notice/all",
  CREATE: "/api/v1/notice/create-notice",
  UPDATE: "/api/v1/notice/update-notice",
};

export const HRRequestEndPoints = {
  GETALL: "/api/v1/generate-request/all",
  UPDATE_STATUS: "/api/v1/generate-request/update-request-status",
};

export const HRProfilesEndPoints = {
  GETALL: "/api/v1/HR/all",
  GETONE: (id) => `/api/v1/HR/${id}`,
  UPDATE: "/api/v1/HR/update-HR",
  DELETE: (id) => `/api/v1/HR/delete-HR/${id}`,
};

// Employee-side notices (read-only)
export const EmployeeNoticeEndPoints = {
  GETALL: "/api/v1/notice/employee/all",
};

// Employee-side: leaves
export const EmployeeLeavesEndPoints = {
  MY: "/api/v1/leave/my",
  CREATE: "/api/v1/leave/create-leave",
  UPDATE: "/api/v1/leave/employee-update-leave",
  DELETE: (id) => `/api/v1/leave/delete-leave/${id}`,
};

// Employee-side: generate requests
export const EmployeeRequestsEndPoints = {
  MY: "/api/v1/generate-request/my",
  CREATE: "/api/v1/generate-request/create-request",
  UPDATE: "/api/v1/generate-request/update-request-content",
};

// Employee-side: attendance
export const EmployeeAttendanceEndPoints = {
  MY: "/api/v1/attendance/my",
  INITIALIZE: "/api/v1/attendance/initialize",
  UPDATE: "/api/v1/attendance/update-attendance",
};

// Employee-side: salaries
export const EmployeeSalaryEndPoints = {
  MY: "/api/v1/salary/my",
};

// Employee-side: profile
export const EmployeeProfileEndPoints = {
  GET: "/api/v1/employee/by-employee",
  UPDATE: "/api/v1/employee/update-employee",
};

// Employee-side: performance
export const EmployeePerformanceEndPoints = {
  MY: "/api/v1/employee/performance/my",
};

// Employee-side: tasks & comments
export const EmployeeTaskEndPoints = {
  MY_TASKS: "/api/v1/employee/tasks/my",
  ADD_COMMENT: "/api/v1/employee/tasks/comment",
};

// Manager-side: employees, tasks & reviews
export const ManagerEndPoints = {
  EMPLOYEES: "/api/v1/manager/employees",
  TASKS_FOR_EMPLOYEE: (id) => `/api/v1/manager/tasks/${id}`,
  CREATE_TASK: "/api/v1/manager/tasks",
  UPDATE_TASK_STATUS: "/api/v1/manager/tasks/status",
  REVIEWS_FOR_EMPLOYEE: (id) => `/api/v1/manager/reviews/${id}`,
  CREATE_REVIEW: "/api/v1/manager/reviews",
};

// Notification counts
export const NotificationEndPoints = {
  HR_COUNTS: "/api/v1/notifications/hr/counts",
  HR_MARK_VIEWED: "/api/v1/notifications/hr/mark-viewed",
  EMPLOYEE_COUNTS: "/api/v1/notifications/employee/counts",
  EMPLOYEE_MARK_VIEWED: "/api/v1/notifications/employee/mark-viewed",
};
