import { useAuth } from "../context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/Dialog";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { User, Mail, Shield, KeyRound, CheckCircle2, Calendar, Building2 } from "lucide-react";

export default function UserProfileModal({ open, onOpenChange }) {
    const { user } = useAuth();

    if (!user) return null;

    const roleBadges = {
        admin: { label: "System Administrator", variant: "purple" },
        sales_executive: { label: "Sales Executive", variant: "default" },
        inventory_manager: { label: "Inventory Manager", variant: "indigo" },
        production_manager: { label: "Production Manager", variant: "warning" },
        quality_inspector: { label: "Quality Inspector", variant: "success" },
        dispatch_manager: { label: "Dispatch Manager", variant: "slate" },
    };

    const roleInfo = roleBadges[user.role] || { label: user.role, variant: "slate" };

    const rolePermissions = {
        admin: [
            "Full System Master Access",
            "Customer Management & Verification",
            "Sales Order Processing & MRP Overrides",
            "Production Scheduling & Machine Allocation",
            "Quality Inspection & Batch Approvals",
            "Logistics, Fleet Dispatch & Tracking",
            "System User Administration & Audit Log Review",
        ],
        sales_executive: [
            "Customer Creation, Search & Profile Updates",
            "Sales Order Creation & Modification",
            "Order Status Lifecycle Tracking",
            "Commercial Sales Reports",
        ],
        inventory_manager: [
            "Raw Material Master Management",
            "Warehouse Stock Adjustments & Audit Reasons",
            "Stock Level Monitoring & Reorder Warnings",
            "Inventory Valuation & Stock Movement Logs",
        ],
        production_manager: [
            "Product Master & Bill of Materials (BOM) Recipes",
            "Material Requirement Planning (MRP) Simulation",
            "Production Plan Scheduling & Machine Allocation",
            "Stage Progression & Material Consumption",
        ],
        quality_inspector: [
            "Quality Control Inspection Checklist",
            "Pass/Fail Batch Approvals & Defect Tracking",
            "Finished Goods Batch Generation on QC Pass",
            "Quality Assurance Analytics & Pass Rate Reports",
        ],
        dispatch_manager: [
            "Ready for Dispatch Order Fulfillment Panel",
            "Shipment Creation, Vehicle & Driver Allocation",
            "Carrier Integration & Milestone Simulation",
            "Dispatch Timeline & Public Tracking",
        ],
    };

    const permissions = rolePermissions[user.role] || ["Basic View Access"];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
                <DialogHeader>
                    <DialogTitle>My Account Profile</DialogTitle>
                    <DialogDescription>
                        Authenticated manufacturing ERP account details and authorizations
                    </DialogDescription>
                </DialogHeader>

                {/* Profile Card Header */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-3.5 mb-5">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-sky-400 to-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-xs font-heading">
                        {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-heading font-bold text-slate-900 text-base truncate">
                                {user.name}
                            </h4>
                            <Badge variant={roleInfo.variant} className="text-[10px]">
                                {roleInfo.label}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-body flex items-center gap-1.5 mt-0.5 truncate">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {user.email}
                        </p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-3 text-xs font-body mb-5">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5">
                            <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                            User Identifier (ID):
                        </span>
                        <span className="font-mono text-slate-700 select-all font-medium">
                            {user._id || user.id || "USR-LIVE"}
                        </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            Account Status:
                        </span>
                        <span className="font-semibold text-emerald-600">Active / Verified</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-slate-400" />
                            Authentication Mode:
                        </span>
                        <span className="font-medium text-slate-700">JWT Bearer Token + Refresh</span>
                    </div>
                </div>

                {/* Permissions Section */}
                <div>
                    <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-heading mb-2">
                        Assigned Role Permissions
                    </h5>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {permissions.map((perm, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50/70 border border-slate-100 text-[11.5px] text-slate-700"
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                                <span>{perm}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
