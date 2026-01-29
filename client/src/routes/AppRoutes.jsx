import { createBrowserRouter } from "react-router-dom";
import { ErrorBoundaryPage } from "./ErrorBoundary.jsx";
import { EmployeeRoutes } from "./employeeroutes.jsx";
import { HRRoutes } from "./HRroutes.jsx";

export const router = createBrowserRouter(
  [
    ...EmployeeRoutes.map((r) => ({
      ...r,
      errorElement: <ErrorBoundaryPage />,
    })),
    ...HRRoutes.map((r) => ({ ...r, errorElement: <ErrorBoundaryPage /> })),
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionStatusRevalidation: true,
      v7_startTransition: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);
