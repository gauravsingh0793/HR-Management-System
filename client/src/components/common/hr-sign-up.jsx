import { ErrorPopup } from "./error-popup";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import PropTypes from "prop-types";

export const HRSignUp = ({
  handlesignupform,
  handlesubmitform,
  stateformdata,
  errorpopup,
}) => {
  const employeestate = useSelector((state) => state.HRReducer);
  return (
    <>
      {employeestate.error.status ? (
        <ErrorPopup error={employeestate.error.message} />
      ) : null}
      {errorpopup ? (
        <ErrorPopup error={"Password does not match, Please try again"} />
      ) : null}
      <div className="HR-form-content justify-center items-center min-h-screen py-4 px-4 sm:px-6 lg:px-8 relative overflow-hidden app-shell">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-4 animate-fade-in-down">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-3 shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent mb-1">
              Create HR Account
            </h1>
            <p className="text-slate-600 text-base">
              Fill in your details to get started
            </p>
          </div>

          {/* Main Content - Image and Form Side by Side */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 max-w-5xl mx-auto">
            {/* Image Section - Left Side */}
            <div className="form-img flex-shrink-0 animate-fade-in-right">
              <div className="rounded-2xl p-8">
                <img
                  src="/assets/Employee-Welcome.jpg"
                  alt="Welcome"
                  className="w-full max-w-sm h-auto drop-shadow-lg transform hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Form Fields - Right Side in Two Columns */}
            <div className="flex-1 w-full animate-fade-in-left">
              <div className="form-container w-full">
                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-x-6">
                  {/* Left Column */}
                  <div className="label-field-pair flex flex-col space-y-2">
                    <label
                      htmlFor="firstname"
                      className="text-sm font-semibold text-slate-700"
                    >
                      First Name
                    </label>
                    <input
                      id="firstname"
                      name="firstname"
                      type="text"
                      required
                      autoComplete="given-name"
                      value={stateformdata.firstname}
                      onChange={handlesignupform}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 text-sm"
                      placeholder=""
                    />
                  </div>

                  {/* Right Column */}
                  <div className="label-field-pair flex flex-col space-y-2">
                    <label
                      htmlFor="contactnumber"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Contact Number
                    </label>
                    <input
                      id="contactnumber"
                      name="contactnumber"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={stateformdata.contactnumber}
                      onChange={handlesignupform}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 text-sm"
                      placeholder=""
                    />
                  </div>

                  {/* Last Name */}
                  <div className="label-field-pair flex flex-col space-y-2">
                    <label
                      htmlFor="lastname"
                      className="text-sm font-semibold text-slate-700"
                    >
                      last Name
                    </label>
                    <input
                      id="lastname"
                      name="lastname"
                      type="text"
                      required
                      autoComplete="family-name"
                      value={stateformdata.lastname}
                      onChange={handlesignupform}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 text-sm"
                      placeholder=""
                    />
                  </div>

                  {/* Empty space for alignment */}
                  <div></div>

                  {/* Email */}
                  <div className="label-field-pair flex flex-col space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={stateformdata.email}
                      onChange={handlesignupform}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 text-sm"
                      placeholder=""
                    />
                  </div>

                  {/* Empty space for alignment */}
                  <div></div>

                  {/* Password */}
                  <div className="label-field-pair flex flex-col space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={stateformdata.password}
                      onChange={handlesignupform}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 text-sm"
                      placeholder=""
                    />
                  </div>

                  {/* Empty space for alignment */}
                  <div></div>

                  {/* Confirm Password */}
                  <div className="label-field-pair flex flex-col space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={stateformdata.confirmPassword}
                      onChange={handlesignupform}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 text-sm"
                      placeholder=""
                    />
                  </div>

                  {/* Empty space for alignment */}
                  <div></div>
                </div>

                {/* Organization Information Section removed as per requirement */}

                {/* Buttons Section */}
                <div className="buttons w-full flex flex-col gap-3 mt-6">
                  <Button
                    className="group w-full md:w-auto px-8 py-2.5 bg-purple-600 hover:bg-purple-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-white"
                    onClick={handlesubmitform}
                  >
                    Sign Up
                  </Button>
                  <div className="sign-in flex flex-col sm:flex-row justify-start items-center gap-2">
                    <p className="text-slate-600 text-sm">
                      Already Have an Account?
                    </p>
                    <Link to={"/auth/HR/login"}>
                      <Button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 font-semibold rounded-lg transition-all duration-300 text-white">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

HRSignUp.propTypes = {
  handlesignupform: PropTypes.func.isRequired,
  handlesubmitform: PropTypes.func.isRequired,
  stateformdata: PropTypes.shape({
    firstname: PropTypes.string,
    lastname: PropTypes.string,
    email: PropTypes.string,
    contactnumber: PropTypes.string,
    password: PropTypes.string,
    confirmPassword: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    OrganizationURL: PropTypes.string,
    OrganizationMail: PropTypes.string,
  }).isRequired,
  errorpopup: PropTypes.bool,
};
