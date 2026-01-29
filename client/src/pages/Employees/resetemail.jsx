import { ResetVerifyEmailPage } from "../common/verify-email";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingBar from "react-top-loading-bar";
import { CommonStateHandler } from "../../utils/commonhandler.js";
import {
  HandleGetEmployees,
  HandlePostEmployees,
} from "../../redux/Thunks/EmployeeThunk.js";

export const EmployeeResetVerifyEmailPage = () => {
  const EMState = useSelector((state) => state.EmployeeReducer);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loadingbar = useRef(null);
  const [emailvalue, setemailvalue] = useState({
    email: "",
  });

  const handleverifybutton = () => {
    loadingbar.current.continuousStart();
    dispatch(
      HandlePostEmployees({ apiroute: "RESEND_VERIFY_EMAIL", data: emailvalue })
    );
  };

  const handleverifyemail = (event) => {
    CommonStateHandler(emailvalue, setemailvalue, event);
  };

  useEffect(() => {
    if (EMState.isAuthenticated) {
      loadingbar.current.complete();
      navigate("/auth/employee/verify-email");
    }
  }, [EMState.isAuthenticated]);

  return (
    <>
      <LoadingBar ref={loadingbar} />
      <ResetVerifyEmailPage
        handleverifybutton={handleverifybutton}
        handleverifyemail={handleverifyemail}
        emailvalue={emailvalue.email}
        targetstate={EMState}
      />
    </>
  );
};
