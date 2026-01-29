import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

export const CelebrationAnimation = ({ show, onComplete, message = "Success!" }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(300px) rotate(360deg) scale(0.5);
            opacity: 0;
          }
        }
        .confetti-piece {
          animation: confetti-fall 2s ease-out forwards;
        }
      `}</style>
      <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-blue-500/30 to-purple-500/30 backdrop-blur-md animate-fade-in" />
        
        {/* Main Celebration Card */}
        <div className="relative z-10 frosted-card rounded-2xl p-10 shadow-2xl animate-scale-in border-2 border-emerald-300 max-w-md w-full mx-4">
          <div className="flex flex-col items-center gap-6">
            {/* Success Icon with Animation */}
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 rounded-full blur-3xl opacity-60 animate-pulse" />
              <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full p-4 shadow-lg">
                <CheckCircle2 className="w-16 h-16 text-white" />
              </div>
            </div>
            
            {/* Message */}
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                {message}
              </h3>
              <p className="text-slate-600 text-lg">Action completed successfully!</p>
            </div>
          </div>
          
          {/* Confetti Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
            {[...Array(50)].map((_, i) => {
              const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];
              const left = 50 + (Math.random() - 0.5) * 150;
              const top = 50 + (Math.random() - 0.5) * 150;
              const delay = Math.random() * 0.8;
              const duration = 1.5 + Math.random() * 1;
              return (
                <div
                  key={i}
                  className="confetti-piece absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: colors[i % colors.length],
                    left: `${left}%`,
                    top: `${top}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

