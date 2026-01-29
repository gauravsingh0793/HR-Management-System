import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    (<ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === "destructive"
        const isSuccess = variant === "success" || !variant
        
        return (
          (<Toast key={id} variant={variant} {...props} className="animate-scale-in">
            <div className="flex w-full items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {isDestructive ? (
                  <XCircle className="w-5 h-5 text-red-500 animate-pulse" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-scale-in" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="grid flex-1 gap-1">
                {title && <ToastTitle className="text-[15px] font-semibold leading-tight">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose className="text-slate-500 hover:text-slate-900 dark:text-slate-300 transition-colors duration-200" />
            </div>
          </Toast>)
        );
      })}
      <ToastViewport />
    </ToastProvider>)
  );
}
