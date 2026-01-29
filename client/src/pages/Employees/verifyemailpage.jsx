import { Verify_Email_Component } from "../../components/common/verify-email.jsx";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import LoadingBar from "react-top-loading-bar";
import { useNavigate } from "react-router-dom";
import {
  HandlePostEmployees,
  HandleGetEmployees,
} from "../../redux/Thunks/EmployeeThunk.js";

export const EmployeeVerifyEmailPage = () => {
  const EMState = useSelector((state) => state.EmployeeReducer);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loadingbar = useRef(null);
  const [verificationcode, setverificationcode] = useState("");

  const handleCodeValue = (value) => {
    setverificationcode(value);
  };

  const handleOTPsubmit = () => {
    loadingbar.current.continuousStart();
    dispatch(
      HandlePostEmployees({
        apiroute: "VERIFY_EMAIL",
        data: { verificationcode },
      })
    );
  };

  useEffect(() => {
    // Check code availability on mount
    dispatch(HandleGetEmployees({ apiroute: "CHECK_VERIFY_EMAIL" }));
  }, []);

  useEffect(() => {
    if (EMState.isAuthenticated) {
      loadingbar.current.complete();
      navigate("/auth/employee/employee-dashboard");
    }
  }, [EMState.isAuthenticated]);

  return (
    <>
      <LoadingBar ref={loadingbar} />
      <Verify_Email_Component
        handleCodeValue={handleCodeValue}
        value={verificationcode}
        handleOTPsubmit={handleOTPsubmit}
      />
    </>
  );
};
