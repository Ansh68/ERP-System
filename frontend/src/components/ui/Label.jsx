import React from "react";
import { cn } from "../../lib/utils";

export const Label = React.forwardRef(({ className, children, ...props }, ref) => {
    return (
        <label
            ref={ref}
            className={cn(
                "block text-xs font-semibold text-slate-700 font-heading mb-1.5 uppercase tracking-wider",
                className
            )}
            {...props}
        >
            {children}
        </label>
    );
});
Label.displayName = "Label";
