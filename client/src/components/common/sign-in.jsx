import { ErrorPopup } from "./error-popup";
import { Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, LogIn } from "lucide-react";

export const SignIn = ({
  image,
  handlesigninform,
  handlesigninsubmit,
  targetedstate,
  statevalue,
  redirectpath,
}) => {
  return (
    <>
      {targetedstate.error.status ? (
        <ErrorPopup error={targetedstate.error.message} />
      ) : null}
      <div className="flex min-h-full flex-1 min-[200px]:flex-col md:flex-row md:items-center justify-center px-6 py-12 lg:px-8 md:gap-8 relative overflow-hidden app-shell">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>

        {/* Image Section */}
        <div className="sm:mx-auto sm:w-full sm:max-w-sm lg:mx-10 relative z-10 animate-fade-in-right">
          <div className="frosted-card rounded-2xl p-8 hover-lift">
            <img
              alt="Your Company"
              src={image}
              className="mx-auto h-auto w-auto drop-shadow-lg transform hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Form Section */}
        <div className="my-5 sm:mx-auto sm:w-full sm:max-w-md lg:mx-10 relative z-10 animate-fade-in-left">
          <div className="frosted-card rounded-2xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Welcome back! Please enter your details.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handlesigninsubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={statevalue.email}
                    onChange={handlesigninform}
                    className="block w-full rounded-lg border border-slate-200 bg-white/80 py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <div className="text-sm">
                    <Link
                      to={redirectpath}
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={statevalue.password}
                    onChange={handlesigninform}
                    className="block w-full rounded-lg border border-slate-200 bg-white/80 py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-300 hover-lift relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Sign in
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
