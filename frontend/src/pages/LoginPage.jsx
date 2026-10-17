import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Mail,
    Lock,
    User,
    Shield,
    Eye,
    EyeOff,
    Loader2,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    Users,
    Boxes,
    Factory,
    ShieldCheck,
    Truck,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";

export default function LoginPage() {
    const { login, register, demoLogin } = useAuth();
    const navigate = useNavigate();

    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState("sales_executive");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isRegister) {
            if (!name.trim() || !/^[a-zA-Z\s]{2,50}$/.test(name.trim())) {
                toast.error("Full name must contain only letters and spaces (2-50 characters)");
                return;
            }
        }

        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            toast.error("Please enter a valid work email address");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        const actionToast = toast.loading(isRegister ? "Creating account..." : "Signing in...");

        try {
            if (isRegister) {
                await register(name.trim(), email.trim(), password, role);
                toast.success("Account registered! Logging you in...", { id: actionToast });
                await login(email.trim(), password);
            } else {
                await login(email.trim(), password);
                toast.success("Welcome back!", { id: actionToast });
            }
            navigate("/");
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Authentication failed", {
                id: actionToast,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleQuickRoleLogin = async (roleEmail, roleTitle) => {
        setLoading(true);
        const actionToast = toast.loading(`Logging in as ${roleTitle}...`);
        try {
            await demoLogin(roleEmail);
            toast.success(`Logged in as ${roleTitle}`, { id: actionToast });
            navigate("/");
        } catch (err) {
            toast.error(
                err.response?.data?.message || `Failed to log in as ${roleTitle}. Account may need registration.`,
                { id: actionToast }
            );
        } finally {
            setLoading(false);
        }
    };

    const roleOptions = [
        { value: "admin", label: "Admin", desc: "Full administrative system access" },
        { value: "sales_executive", label: "Sales Executive", desc: "Customers & Sales Orders" },
        { value: "inventory_manager", label: "Inventory Manager", desc: "Raw Materials & Stock" },
        { value: "production_manager", label: "Production Manager", desc: "BOM, MRP & Shopfloor Plans" },
        { value: "quality_inspector", label: "Quality Inspector", desc: "QC Inspections & Approvals" },
        { value: "dispatch_manager", label: "Dispatch Manager", desc: "Shipments & Fleet Logistics" },
    ];

    const demoAccounts = [
        { title: "Admin", email: "admin@flodata.com", role: "Full Access", icon: Shield },
        { title: "Sales Exec", email: "sales@flodata.com", role: "Orders & Customers", icon: Users },
        { title: "Inventory Mgr", email: "inventory@flodata.com", role: "Stock & Reorders", icon: Boxes },
        { title: "Production Mgr", email: "production@flodata.com", role: "BOM & Scheduling", icon: Factory },
        { title: "QC Inspector", email: "qc@flodata.com", role: "Quality Assurance", icon: ShieldCheck },
        { title: "Dispatch Mgr", email: "dispatch@flodata.com", role: "Carrier Tracking", icon: Truck },
    ];

    return (
        <div className="min-h-screen bg-[#f4f6f8] flex flex-col justify-center items-center p-4 sm:p-6 font-body text-slate-800">
            {/* Top Brand Banner */}
            <div className="w-full max-w-md text-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
                    FloData ERP
                </h1>
                <p className="text-xs text-slate-500 font-body mt-1">
                    Manufacturing Order Processing & Production System
                </p>
            </div>

            {/* Auth Card Container */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-slate-200/80 overflow-hidden">
                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 border-b border-slate-100 p-1.5 bg-slate-50/70">
                    <button
                        type="button"
                        onClick={() => setIsRegister(false)}
                        className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 font-heading cursor-pointer ${!isRegister
                                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsRegister(true)}
                        className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 font-heading cursor-pointer ${isRegister
                                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        Create Account
                    </button>
                </div>

                <div className="p-6 sm:p-7">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Field (Register Mode Only) */}
                        {isRegister && (
                            <div>
                                <Label htmlFor="fullName">Full Name *</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <Input
                                        id="fullName"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))
                                        }
                                        placeholder="e.g. Emma Johnson"
                                        maxLength={50}
                                        className="pl-9"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">Letters and spaces only (2-50 chars)</p>
                            </div>
                        )}

                        {/* Email Address */}
                        <div>
                            <Label htmlFor="email">Work Email *</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@flodata.com"
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* Password Field with Show/Hide Toggle */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label htmlFor="password" className="mb-0">Password *</Label>
                                <span className="text-[11px] text-slate-400 font-normal">Min 6 chars</span>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="pl-9 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                    tabIndex={-1}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Role Selector (Register Mode Only) */}
                        {isRegister && (
                            <div>
                                <Label htmlFor="roleSelector">Assigned Role *</Label>
                                <div className="relative">
                                    <select
                                        id="roleSelector"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-body text-slate-900 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/15"
                                    >
                                        {roleOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label} — {opt.desc}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Submit Action Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-10 text-sm font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 shadow-xs font-heading cursor-pointer text-white mt-1"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    {isRegister ? "Create Account & Sign In" : "Sign In to ERP"}
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Quick Role Login Section for Testing */}
                    {!isRegister && (
                        <div className="mt-6 pt-5 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    1-Click Demo Accounts
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">Test Mode</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {demoAccounts.map((acc) => {
                                    const Icon = acc.icon;
                                    return (
                                        <button
                                            key={acc.email}
                                            type="button"
                                            disabled={loading}
                                            onClick={() => handleQuickRoleLogin(acc.email, acc.title)}
                                            className="p-2.5 rounded-xl border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/30 text-left transition-all duration-150 group cursor-pointer bg-white"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-slate-800 group-hover:text-sky-600 font-heading">
                                                    {acc.title}
                                                </span>
                                                <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-500" />
                                            </div>
                                            <p className="text-[10.5px] text-slate-400 truncate">
                                                {acc.email}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer security badge */}
                <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Protected with JWT & Role-Based Access Control</span>
                </div>
            </div>

            <p className="mt-5 text-xs text-slate-400 font-body">
                FloData Manufacturing Suite © 2026. All rights reserved.
            </p>
        </div>
    );
}
