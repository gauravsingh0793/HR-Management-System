import { ErrorPopup } from "./error-popup";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus, User, Mail, Lock, Phone, ArrowRight } from "lucide-react";
import PropTypes from "prop-types";

export const SignUP = ({
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
          <div className="flex min-[200px]:flex-col md:flex-row md:items-start justify-center gap-8">
            {/* Image Section */}
            <div className="form-img sm:mx-auto sm:w-full sm:max-w-sm lg:mx-10 animate-fade-in-right">
              <div className="frosted-card rounded-2xl p-8 hover-lift">
                <img
                  src="/assets/Employee-Welcome.jpg"
                  alt="Welcome"
                  className="mx-auto h-auto w-auto drop-shadow-lg transform hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Form Card */}
            <div className="my-3 sm:mx-auto sm:w-full sm:max-w-md lg:mx-10 animate-fade-in-left">
              <div className="frosted-card rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <div className="form-container w-full">
                  {/* Personal Information Group */}
                  <div className="form-group-1 w-full flex flex-col gap-3">
                    <h3 className="text-base font-semibold text-slate-800 mb-1 flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600" />
                      Personal Information
                    </h3>

                    <div className="label-field-pair flex flex-col space-y-2">
                      <label
                        htmlFor="firstname"
                        className="text-sm font-semibold text-slate-700"
                      >
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          id="firstname"
                          name="firstname"
                          type="text"
                          required
                          autoComplete="given-name"
                          value={stateformdata.firstname}
                          onChange={handlesignupform}
                          className="w-full rounded-lg border border-slate-200 bg-white/80 py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all duration-200 sm:text-sm"
                          placeholder="John"
                        />
                      </div>
                    </div>

                    <div className="label-field-pair flex flex-col space-y-2">
                      <label
                        htmlFor="lastname"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Last Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          id="lastname"
                          name="lastname"
                          type="text"
                          required
                          autoComplete="family-name"
                          value={stateformdata.lastname}
                          onChange={handlesignupform}
                          className="w-full rounded-lg border border-slate-200 bg-white/80 py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all duration-200 sm:text-sm"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div className="label-field-pair flex flex-col space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          value={stateformdata.email}
                          onChange={handlesignupform}
                          className="w-full rounded-lg border border-slate-200 bg-white/80 py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all duration-200 sm:text-sm"
                          placeholder="john.doe@example.com"
                        />
                      </div>
                    </div>

                    <div className="label-field-pair flex flex-col space-y-2">
                      <label
                        htmlFor="contactnumber"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Contact Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          id="contactnumber"
                          name="contactnumber"
                          type="tel"
                          required
                          autoComplete="tel"
                          value={stateformdata.contactnumber}
                          onChange={handlesignupform}
                          className="w-full rounded-lg border border-slate-200 bg-white/80 py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all duration-200 sm:text-sm"
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>

                    <div className="label-field-pair flex flex-col space-y-2">
                      <label
                        htmlFor="password"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          id="password"
                          name="password"
                          type="password"
                          required
                          autoComplete="new-password"
                          value={stateformdata.password}
                          onChange={handlesignupform}
                          className="w-full rounded-lg border border-slate-200 bg-white/80 py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all duration-200 sm:text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="label-field-pair flex flex-col space-y-2">
                      <label
                        htmlFor="confirmPassword"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          required
                          autoComplete="new-password"
                          value={stateformdata.confirmPassword}
                          onChange={handlesignupform}
                          className="w-full rounded-lg border border-slate-200 bg-white/80 py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all duration-200 sm:text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons Section */}
                  <div className="buttons w-full flex flex-col gap-3 mt-6 pt-4 border-t border-slate-200">
                    <Button
                      className="group w-full px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover-lift relative overflow-hidden"
                      onClick={handlesubmitform}
                    >
                      <span className="relative z-20 flex items-center justify-center gap-2 text-white">
                        Sign Up
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </Button>
                    <div className="sign-in flex flex-col sm:flex-row justify-center items-center gap-2">
                      <p className="text-slate-600 text-sm">
                        Already Have an Account?
                      </p>
                      <Link to={"/auth/HR/login"}>
                        <Button className="px-6 py-2.5 bg-white border-2 border-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-all duration-300 hover-lift">
                          <span className="relative z-20 text-purple-600">
                            Sign In
                          </span>
                        </Button>
                      </Link>
                    </div>
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

SignUP.propTypes = {
  handlesignupform: PropTypes.func.isRequired,
  handlesubmitform: PropTypes.func.isRequired,
  stateformdata: PropTypes.shape({
    firstname: PropTypes.string,
    lastname: PropTypes.string,
    email: PropTypes.string,
    contactnumber: PropTypes.string,
    password: PropTypes.string,
    confirmPassword: PropTypes.string,
  }).isRequired,
  errorpopup: PropTypes.bool,
};
