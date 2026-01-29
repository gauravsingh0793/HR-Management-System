import { Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef } from "react";
import { HandleGetEmployees } from "../redux/Thunks/EmployeeThunk";
import { Loading } from "../components/common/loading.jsx";

export const ProtectedRoutes = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector(
    (state) => state.employeereducer,
  );
  const dispatch = useDispatch();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    dispatch(HandleGetEmployees({ apiroute: "CHECKELOGIN" }));
  }, [dispatch]);

  // Show loading while checking authentication
  if (isLoading && !hasCheckedRef.current) {
    return <Loading />;
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;

  return <main className="min-h-screen flex flex-col">{children}</main>;
};
