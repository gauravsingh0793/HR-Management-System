import { HandleGetHumanResources } from "../redux/Thunks/HRThunk.js";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Loading } from "../components/common/loading.jsx";

export const HRProtectedRoutes = ({ children }) => {
    const dispatch = useDispatch();
    const hasCheckedRef = useRef(false);
    const HRState = useSelector((state) => state.HRReducer);

    // Run a single bootstrap check on first mount to restore session from cookies
    useEffect(() => {
        if (hasCheckedRef.current) return;
        hasCheckedRef.current = true;
        dispatch(HandleGetHumanResources({ apiroute: "CHECKLOGIN" }));
        dispatch(HandleGetHumanResources({ apiroute: "CHECK_VERIFY_EMAIL" }));
    }, [dispatch]);

    // While checking auth, keep the loader visible
    if (HRState.isLoading) {
        return <Loading />;
    }

    // Verified session: allow access
    if (HRState.isAuthenticated && HRState.isAuthourized && HRState.isVerified) {
        return children;
    }

    // Logged in but not verified: send to verification flow
    if (HRState.isAuthenticated && HRState.isAuthourized && !HRState.isVerified) {
        return <Navigate to="/auth/HR/reset-email-validation" replace />;
    }

    // Not authenticated after check: send to login
    return <Navigate to="/auth/HR/login" replace />;
};