import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function Dialog({ open, onOpenChange, children }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && open) {
                onOpenChange?.(false);
            }
        };
        if (open) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200"
                onClick={() => onOpenChange?.(false)}
            />
            {/* Content Container */}
            <div className="relative z-50 w-full flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto w-full">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function DialogContent({ className, children, onClose, ...props }) {
    return (
        <div
            className={cn(
                "relative mx-auto w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-7 overflow-hidden text-slate-800 transition-all font-body",
                className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
        >
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <X className="h-4.5 w-4.5" />
                </button>
            )}
            {children}
        </div>
    );
}

export function DialogHeader({ className, children, ...props }) {
    return (
        <div className={cn("mb-5 space-y-1 text-left", className)} {...props}>
            {children}
        </div>
    );
}

export function DialogTitle({ className, children, ...props }) {
    return (
        <h3
            className={cn("text-lg font-bold text-slate-900 font-heading tracking-tight leading-snug", className)}
            {...props}
        >
            {children}
        </h3>
    );
}

export function DialogDescription({ className, children, ...props }) {
    return (
        <p className={cn("text-xs text-slate-500 font-body", className)} {...props}>
            {children}
        </p>
    );
}

export function DialogFooter({ className, children, ...props }) {
    return (
        <div
            className={cn("mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5", className)}
            {...props}
        >
            {children}
        </div>
    );
}
