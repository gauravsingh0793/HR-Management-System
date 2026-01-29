import { HRSignUp } from "../../components/common/hr-sign-up.jsx";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
// import { HandlePostEmployees, HandleGetEmployees } from "../../redux/Thunks/EmployeeThunk.js"
import LoadingBar from "react-top-loading-bar";
import { useNavigate } from "react-router-dom";
import { CommonStateHandler } from "../../utils/commonhandler.js";
import {
  HandlePostHumanResources,
  HandleGetHumanResources,
} from "../../redux/Thunks/HRThunk.js";

export const HRSignupPage = () => {
  const HRState = useSelector((state) => state.HRReducer);
  const [errorpopup, seterrorpopup] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loadingbar = useRef(null);
  const [signupform, set_signuform] = useState({
    firstname: "",
    lastname: "",
    email: "",
    contactnumber: "",
    password: "",
    confirmPassword: "",
    name: "",
    description: "",
    OrganizationURL: "",
    OrganizationMail: "",
  });

  const handlesignupform = (event) => {
    CommonStateHandler(signupform, set_signuform, event);
  };

  const handlesubmitform = (event) => {
    if (signupform.password === signupform.confirmPassword) {
      event.preventDefault();
      seterrorpopup(false);
      loadingbar.current.continuousStart();
      // Only send password field to backend, not confirmPassword
      // Auto-fill organization details since the UI no longer asks for them
      const organizationName =
        (signupform.name && signupform.name.trim()) ||
        `${signupform.firstname || ""} ${signupform.lastname || ""}`.trim() ||
        "My Organization";

      const organizationDescription =
        (signupform.description && signupform.description.trim()) ||
        `Organization for ${signupform.email || "HR user"}`;

      const organizationURL =
        (signupform.OrganizationURL && signupform.OrganizationURL.trim()) ||
        "https://example.com";

      const organizationMail =
        (signupform.OrganizationMail && signupform.OrganizationMail.trim()) ||
        signupform.email;

      const { confirmPassword, ...rest } = signupform;

      const dataToSubmit = {
        ...rest,
        name: organizationName,
        description: organizationDescription,
        OrganizationURL: organizationURL,
        OrganizationMail: organizationMail,
      };

      dispatch(
        HandlePostHumanResources({ apiroute: "SIGNUP", data: dataToSubmit })
      );
    } else {
      event.preventDefault();
      seterrorpopup(true);
    }
  };

  if (HRState.error.status) {
    loadingbar.current.complete();
  }

  useEffect(() => {
    if (!HRState.isAuthenticated && !HRState.isVerified) {
      dispatch(HandleGetHumanResources({ apiroute: "CHECKLOGIN" }));
      dispatch(HandleGetHumanResources({ apiroute: "CHECK_VERIFY_EMAIL" }));
    }

    if (HRState.isAuthenticated && HRState.isVerified) {
      loadingbar.current.complete();
      navigate("/auth/HR/dashboard/dashboard-data");
    }

    if (HRState.isAuthenticated && !HRState.isVerified) {
      loadingbar.current.complete();
      navigate("/auth/HR/verify-email");
    }
  }, [HRState.isAuthenticated, HRState.isVerified]);

  // console.log(signupform)
  // console.log(HRState)

  return (
    <div className="HRsignup-page-container h-screen flex justify-center min-[900px]:justify-center min-[900px]:items-center">
      <LoadingBar ref={loadingbar} />
      <HRSignUp
        stateformdata={signupform}
        handlesignupform={handlesignupform}
        handlesubmitform={handlesubmitform}
        errorpopup={errorpopup}
      />
    </div>
  );
};
