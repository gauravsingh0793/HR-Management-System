import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Briefcase, Sparkles } from "lucide-react";

export const EntryPage = () => {
  return (
    <div className="entry-page-container h-[100vh] flex justify-center items-center relative overflow-hidden app-shell">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="entry-page-content relative z-10 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Main Content Card */}
        <div className="frosted-card rounded-2xl p-8 sm:p-12 lg:p-16 animate-scale-in">
          {/* Image Section */}
          <div className="entry-image flex flex-col justify-center items-center mb-10 w-auto animate-fade-in-down">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <img
                src="/assets/welcome.png"
                alt="Welcome"
                className="relative sm:max-w-sm md:max-w-md lg:max-w-md xl:max-w-lg drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl text-center font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent leading-tight">
              Welcome To HR Management System
            </h1>
            <p className="text-center text-slate-600 mt-4 text-lg sm:text-xl max-w-2xl">
              Please Select Your Role to Proceed Further
            </p>
          </div>

          {/* Buttons Section */}
          <div className="buttons flex flex-col sm:flex-row justify-center items-center gap-5 mt-12 animate-fade-in-up">
            <Link
              to={"/auth/employee/login"}
              className="w-full sm:w-auto group"
            >
              <Button className="w-full sm:w-64 h-16 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover-lift group relative overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <Users className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  <span>Employee</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </Button>
            </Link>
            <Link to={"/auth/HR/signup"} className="w-full sm:w-auto group">
              <Button className="w-full sm:w-64 h-16 text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover-lift group relative overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <Briefcase className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  <span>HR-Admin</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </Button>
            </Link>
          </div>

          {/* Decorative Elements */}
          <div className="flex justify-center items-center gap-2 mt-8 animate-pulse">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <Sparkles className="w-4 h-4 text-purple-500" />
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
