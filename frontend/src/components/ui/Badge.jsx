import React from "react";
import { cn } from "../../lib/utils";

export function Badge({ className, variant = "default", children, ...props }) {
    const variants = {
        default: "bg-sky-50 text-sky-700 border-sky-200/70",
        slate: "bg-slate-100 text-slate-700 border-slate-200/70",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
        warning: "bg-amber-50 text-amber-800 border-amber-200/70",
        danger: "bg-rose-50 text-rose-700 border-rose-200/70",
        purple: "bg-purple-50 text-purple-700 border-purple-200/70",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-tight font-body",
                variants[variant] || variants.default,
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
