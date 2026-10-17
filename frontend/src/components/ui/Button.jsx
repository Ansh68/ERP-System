import React from "react";
import { cn } from "../../lib/utils";

export const Button = React.forwardRef(
    (
        {
            className,
            variant = "default",
            size = "default",
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const variants = {
            default:
                "bg-sky-500 text-white hover:bg-sky-600 active:bg-sky-700 shadow-xs font-medium border border-transparent",
            dark:
                "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-xs font-medium border border-transparent",
            secondary:
                "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/80 font-medium",
            outline:
                "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 shadow-xs font-medium",
            ghost:
                "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 font-medium",
            danger:
                "bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100 active:bg-rose-200 font-medium",
            success:
                "bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 active:bg-emerald-200 font-medium",
        };

        const sizes = {
            sm: "h-8 px-2.5 text-xs rounded-lg gap-1.5",
            default: "h-9 px-3.5 text-sm rounded-xl gap-2",
            lg: "h-11 px-5 text-sm sm:text-base rounded-xl gap-2.5",
            icon: "h-9 w-9 p-0 rounded-xl justify-center",
        };

        return (
            <button
                ref={ref}
                disabled={disabled}
                className={cn(
                    "inline-flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/20 focus-visible:border-sky-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
                    variants[variant] || variants.default,
                    sizes[size] || sizes.default,
                    className
                )}
                {...props}
            >
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";
