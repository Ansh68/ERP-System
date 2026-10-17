import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
    Users,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Search,
    ChevronLeft,
    ChevronRight,
    UserCheck,
    UserX,
    Clock,
    Activity,
    Lock,
    KeyRound,
    Eye,
    Terminal,
    Fingerprint,
    CheckCircle2,
    AlertCircle,
    X,
    Filter,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/Dialog";

const ROLE_CONFIG = {
    admin: { label: "System Administrator", color: "bg-purple-50 text-purple-700 border-purple-200" },
    sales_executive: { label: "Sales Executive", color: "bg-sky-50 text-sky-700 border-sky-200" },
    inventory_manager: { label: "Inventory Manager", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    production_manager: { label: "Production Manager", color: "bg-amber-50 text-amber-700 border-amber-200" },
    quality_inspector: { label: "Quality Inspector", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    dispatch_manager: { label: "Dispatch Manager", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
};

const ROLE_PERMISSIONS = {
    admin: [
        "Full Master Access (Customers, BOM, Materials)",
        "Sales Orders Approval & Cancellation",
        "Shop Floor Scheduling & Stage Override",
        "Quality Clearance & Batch Issuance",
        "Consignment Dispatch & Carrier Control",
        "System RBAC User Activation & Deactivation",
        "All 6 Executive Intelligence Reports",
    ],
    sales_executive: [
        "Create & Manage Customer Master Accounts",
        "Draft & Submit Sales Orders",
        "Live Inventory Stock & MRP Feasibility Lookups",
        "Sales & Dispatch Operational Reports",
    ],
    inventory_manager: [
        "Raw Materials Catalog & Min/Reorder Thresholds",
        "Direct Stock Receipts & Adjustments",
        "Finished Goods Inventory Tracking",
        "Inventory Valuation & Low-Stock Replenishment Reports",
    ],
    production_manager: [
        "Create Production Plans from Approved Orders",
        "Advance 6-Stage Manufacturing Execution",
        "Raw Material Physical Issuance to Line",
        "Machine & 3-Shift Operational Capacity Planning",
    ],
    quality_inspector: [
        "Access Completed Production Inspection Queue",
        "Conduct 4-Point Parameter Testing (V/D/W/F)",
        "Approve Batches & Issue FG Batch Numbers",
        "Flag Batches for Rework or Scrap",
    ],
    dispatch_manager: [
        "Access QC-Certified Ready Orders",
        "Create Consignments, Assign Carriers & Drivers",
        "Advance Carrier Telematics & Waybill Simulation",
        "Confirm Delivery & Close Order Lifecycles",
    ],
};

const ACTION_COLORS = {
    CREATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    UPDATE: "bg-sky-50 text-sky-700 border-sky-200",
    DELETE: "bg-rose-50 text-rose-700 border-rose-200",
    LOGIN: "bg-purple-50 text-purple-700 border-purple-200",
    LOGOUT: "bg-slate-100 text-slate-700 border-slate-200",
    STAGE_CHANGE: "bg-amber-50 text-amber-700 border-amber-200",
    STATUS_TOGGLE: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export default function UsersAuditPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("users"); // "users" | "audit"
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Users filtering
    const [userSearch, setUserSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    // Audit logs filtering
    const [auditSearch, setAuditSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [auditPage, setAuditPage] = useState(1);
    const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

    // Modals
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedLog, setSelectedLog] = useState(null);

    const isAdmin = user?.role === "admin";

    const fetchUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await apiClient.get("/auth/users");
            if (res.data?.success) {
                setUsers(res.data.data || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Admin authorization required to view system accounts.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        setLoading(true);
        setError("");
        try {
            const params = { page: auditPage, limit: 20 };
            if (actionFilter && actionFilter !== "all") {
                params.action = actionFilter;
            }

            const res = await apiClient.get("/audit-logs", { params });
            if (res.data?.success) {
                setAuditLogs(res.data.data.logs || []);
                setAuditPagination(res.data.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Admin authorization required to view system audit logs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdmin) return;
        if (activeTab === "users") {
            fetchUsers();
        } else {
            fetchAuditLogs();
        }
    }, [activeTab, auditPage, actionFilter]);

    // Toggle user status
    const handleToggleUserStatus = async (userId, e) => {
        if (e) e.stopPropagation();
        const actionToast = toast.loading("Updating account security status...");
        try {
            const res = await apiClient.patch(`/auth/users/${userId}/toggle-status`);
            toast.success(res.data?.message || "Account status toggled successfully!", { id: actionToast });
            fetchUsers();
            if (selectedUser && selectedUser._id === userId) {
                setSelectedUser({
                    ...selectedUser,
                    isActive: !selectedUser.isActive,
                });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update account status", { id: actionToast });
        }
    };

    // Filter users client-side
    const filteredUsers = users.filter((u) => {
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        if (!matchesRole) return false;
        if (!userSearch.trim()) return true;
        const s = userSearch.toLowerCase();
        return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.role?.toLowerCase().includes(s);
    });

    // Filter audit logs client-side search
    const filteredLogs = auditLogs.filter((log) => {
        if (!auditSearch.trim()) return true;
        const s = auditSearch.toLowerCase();
        return (
            log.action?.toLowerCase().includes(s) ||
            log.resource?.toLowerCase().includes(s) ||
            log.user?.name?.toLowerCase().includes(s) ||
            log.user?.email?.toLowerCase().includes(s) ||
            log.ipAddress?.toLowerCase().includes(s)
        );
    });

    // KPI Metrics for Users
    const activeUsersCount = users.filter((u) => u.isActive).length;
    const deactivatedUsersCount = users.filter((u) => !u.isActive).length;

    // Non-admin Access Gate View
    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div className="pb-4 border-b border-slate-200/80">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                        User Management & Security Audit
                    </h1>
                    <p className="text-xs text-slate-500 font-body mt-0.5">
                        Role-based access control and immutable compliance activity logging
                    </p>
                </div>

                <Card className="rounded-2xl p-8 max-w-lg mx-auto text-center bg-white border-amber-200/80">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                        <Lock className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 font-heading">
                        Administrator Authorization Required
                    </h3>
                    <p className="text-xs text-slate-500 font-body mt-1">
                        Your account is currently authorized with the role: <span className="font-semibold text-slate-800 uppercase">{user?.role?.replace("_", " ")}</span>.
                        Managing system accounts and accessing security audit traces requires the <span className="font-semibold text-purple-700">admin</span> role.
                    </p>
                    <div className="mt-5 p-3 bg-slate-50 rounded-xl text-left border border-slate-100 text-xs">
                        <span className="text-[10px] text-slate-400 font-heading block uppercase">Testing Tip</span>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                            Please log in with an Administrator account (admin@flodata.com) to access system security settings.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight">
                            User Management & Security Audit
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/70 font-medium font-heading">
                            Admin Security Console
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-body mt-0.5">
                        Role-based authentication directory, operational account privileges, and immutable audit logs
                    </p>
                </div>
            </div>

            {/* Segmented Top Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl text-xs font-heading max-w-md">
                <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer text-center font-medium flex items-center justify-center gap-2 ${
                        activeTab === "users"
                            ? "bg-white text-slate-900 shadow-2xs font-bold"
                            : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                    <Users className="h-4 w-4" />
                    <span>System Users & RBAC</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("audit")}
                    className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer text-center font-medium flex items-center justify-center gap-2 ${
                        activeTab === "audit"
                            ? "bg-white text-slate-900 shadow-2xs font-bold"
                            : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                    <Activity className="h-4 w-4" />
                    <span>Security Audit Stream</span>
                </button>
            </div>

            {/* ─── TAB 1: SYSTEM USERS & RBAC ────────────────────────────────────── */}
            {activeTab === "users" && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                        <Card className="rounded-2xl p-4 bg-white">
                            <span className="text-xs text-slate-500 font-medium font-heading block">Total Users</span>
                            <span className="text-2xl font-bold text-slate-900 font-heading mt-2 block">
                                {users.length}
                            </span>
                        </Card>

                        <Card className="rounded-2xl p-4 bg-white">
                            <span className="text-xs text-slate-500 font-medium font-heading block">Active Accounts</span>
                            <span className="text-2xl font-bold text-emerald-700 font-heading mt-2 block">
                                {activeUsersCount}
                            </span>
                        </Card>

                        <Card className="rounded-2xl p-4 bg-white">
                            <span className="text-xs text-slate-500 font-medium font-heading block">Deactivated Accounts</span>
                            <span className="text-2xl font-bold text-rose-700 font-heading mt-2 block">
                                {deactivatedUsersCount}
                            </span>
                        </Card>

                        <Card className="rounded-2xl p-4 bg-white">
                            <span className="text-xs text-slate-500 font-medium font-heading block">RBAC Roles</span>
                            <span className="text-2xl font-bold text-purple-700 font-heading mt-2 block">
                                6 Roles
                            </span>
                        </Card>
                    </div>

                    {/* Filter & Search Bar */}
                    <Card className="rounded-2xl">
                        <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-md">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by user name or email..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="pl-9 h-9.5 text-xs rounded-xl"
                                />
                            </div>

                            <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/80 rounded-xl text-xs font-heading">
                                <button
                                    type="button"
                                    onClick={() => setRoleFilter("all")}
                                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                        roleFilter === "all"
                                            ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    All Roles
                                </button>
                                {Object.keys(ROLE_CONFIG).map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRoleFilter(r)}
                                        className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                            roleFilter === r
                                                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                                : "text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                        {ROLE_CONFIG[r].label.split(" ")[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Users Directory Table */}
                    <Card className="rounded-2xl">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-body">
                                    <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold font-heading">User Name</th>
                                            <th className="px-5 py-3 font-semibold font-heading">Email Address</th>
                                            <th className="px-5 py-3 font-semibold font-heading">Assigned Role</th>
                                            <th className="px-5 py-3 font-semibold font-heading">Account Status</th>
                                            <th className="px-5 py-3 font-semibold font-heading">Registered Date</th>
                                            <th className="px-5 py-3 text-right font-semibold font-heading">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i}>
                                                    <td colSpan={6} className="px-5 py-3.5">
                                                        <Skeleton className="h-5 w-full rounded" />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                                    No system users found matching search criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((u) => {
                                                const roleCfg = ROLE_CONFIG[u.role] || { label: u.role, color: "bg-slate-100 text-slate-700 border-slate-200" };
                                                const initials = u.name ? u.name.slice(0, 2).toUpperCase() : "US";

                                                return (
                                                    <tr
                                                        key={u._id}
                                                        onClick={() => setSelectedUser(u)}
                                                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                                    >
                                                        {/* User Name */}
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 font-heading">
                                                                    {initials}
                                                                </div>
                                                                <div>
                                                                    <span className="font-semibold text-slate-900 group-hover:text-purple-700 font-heading block">
                                                                        {u.name}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400">
                                                                        ID: {u._id?.slice(-6)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Email */}
                                                        <td className="px-5 py-3.5 font-mono text-slate-600">
                                                            {u.email}
                                                        </td>

                                                        {/* Role */}
                                                        <td className="px-5 py-3.5">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleCfg.color} font-heading`}>
                                                                {roleCfg.label}
                                                            </span>
                                                        </td>

                                                        {/* Status */}
                                                        <td className="px-5 py-3.5">
                                                            <Badge variant={u.isActive ? "success" : "destructive"} className="text-[10px]">
                                                                {u.isActive ? "ACTIVE" : "DEACTIVATED"}
                                                            </Badge>
                                                        </td>

                                                        {/* Date */}
                                                        <td className="px-5 py-3.5 text-slate-500">
                                                            {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                                                        </td>

                                                        {/* Action */}
                                                        <td className="px-5 py-3.5 text-right">
                                                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                                <Button
                                                                    size="sm"
                                                                    variant={u.isActive ? "secondary" : "default"}
                                                                    onClick={(e) => handleToggleUserStatus(u._id, e)}
                                                                    className="h-7 px-2.5 text-[11px] rounded-lg font-heading"
                                                                >
                                                                    {u.isActive ? "Deactivate" : "Activate"}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setSelectedUser(u)}
                                                                    className="h-7 px-2 text-[11px] rounded-lg text-slate-500 hover:text-slate-900"
                                                                >
                                                                    Dossier
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ─── TAB 2: SECURITY AUDIT STREAM ─────────────────────────────────── */}
            {activeTab === "audit" && (
                <div className="space-y-6">
                    {/* Filter & Search Bar */}
                    <Card className="rounded-2xl">
                        <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-md">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by action, resource, or actor name..."
                                    value={auditSearch}
                                    onChange={(e) => setAuditSearch(e.target.value)}
                                    className="pl-9 h-9.5 text-xs rounded-xl"
                                />
                            </div>

                            <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/80 rounded-xl text-xs font-heading">
                                {["all", "CREATE", "UPDATE", "DELETE", "LOGIN", "STAGE_CHANGE"].map((act) => (
                                    <button
                                        key={act}
                                        type="button"
                                        onClick={() => { setActionFilter(act); setAuditPage(1); }}
                                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap capitalize ${
                                            actionFilter === act
                                                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                                : "text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                        {act === "all" ? "All Events" : act.replace("_", " ")}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Audit Stream Table */}
                    <Card className="rounded-2xl">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-body">
                                    <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold font-heading">Timestamp</th>
                                            <th className="px-5 py-3 font-semibold font-heading">Action</th>
                                            <th className="px-5 py-3 font-semibold font-heading">Target Resource</th>
                                            <th className="px-5 py-3 font-semibold font-heading">Actor Account</th>
                                            <th className="px-5 py-3 font-semibold font-heading">IP Address</th>
                                            <th className="px-5 py-3 text-right font-semibold font-heading">Inspect</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            [...Array(6)].map((_, i) => (
                                                <tr key={i}>
                                                    <td colSpan={6} className="px-5 py-3.5">
                                                        <Skeleton className="h-5 w-full rounded" />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : filteredLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                                    No audit security events recorded.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredLogs.map((log) => {
                                                const actionColor = ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700 border-slate-200";

                                                return (
                                                    <tr
                                                        key={log._id}
                                                        onClick={() => setSelectedLog(log)}
                                                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                                    >
                                                        {/* Timestamp */}
                                                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                                                            {new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString()}
                                                        </td>

                                                        {/* Action Badge */}
                                                        <td className="px-5 py-3.5">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${actionColor} font-heading`}>
                                                                {log.action}
                                                            </span>
                                                        </td>

                                                        {/* Target Resource */}
                                                        <td className="px-5 py-3.5 font-mono text-[11px] text-sky-700">
                                                            <span className="font-semibold">{log.resource}</span>
                                                        </td>

                                                        {/* Actor Account */}
                                                        <td className="px-5 py-3.5">
                                                            <span className="font-semibold text-slate-900 block">
                                                                {log.userName || log.user?.name || "System Automated"}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 block">
                                                                {log.user?.role?.replace("_", " ") || "Service Role"}
                                                            </span>
                                                        </td>

                                                        {/* IP Address */}
                                                        <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">
                                                            {log.ipAddress || "127.0.0.1"}
                                                        </td>

                                                        {/* Inspect */}
                                                        <td className="px-5 py-3.5 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedLog(log)}
                                                                className="h-7 px-2 text-[11px] rounded-lg text-slate-500 hover:text-slate-900"
                                                            >
                                                                Payload
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Audit Pagination */}
                            {auditPagination.totalPages > 1 && (
                                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <span>
                                        Showing Page {auditPagination.page} of {auditPagination.totalPages} ({auditPagination.total} audit traces)
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={auditPage <= 1}
                                            onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                                            className="h-7 px-2.5 rounded-lg gap-1"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                            <span>Prev</span>
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={auditPage >= auditPagination.totalPages}
                                            onClick={() => setAuditPage((p) => p + 1)}
                                            className="h-7 px-2.5 rounded-lg gap-1"
                                        >
                                            <span>Next</span>
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ─── MODAL 1: USER PROFILE & RBAC DOSSIER ──────────────────────────── */}
            {selectedUser && (
                <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
                    <DialogContent className="max-w-lg rounded-2xl p-6">
                        <DialogHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0 font-heading">
                                        {selectedUser.name ? selectedUser.name.slice(0, 2).toUpperCase() : "US"}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-base font-bold text-slate-900 font-heading">
                                            {selectedUser.name}
                                        </DialogTitle>
                                        <p className="text-xs text-slate-500 font-mono">
                                            {selectedUser.email}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={selectedUser.isActive ? "success" : "destructive"}>
                                    {selectedUser.isActive ? "ACTIVE" : "DEACTIVATED"}
                                </Badge>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 my-3 text-xs font-body">
                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">ASSIGNED ROLE</span>
                                    <span className="font-semibold text-purple-700 text-xs uppercase font-heading">
                                        {selectedUser.role?.replace("_", " ")}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">USER ID</span>
                                    <span className="font-mono text-slate-700 text-xs">
                                        {selectedUser._id}
                                    </span>
                                </div>
                            </div>

                            {/* Permissions Matrix */}
                            <div>
                                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-2 font-heading">
                                    Department Functional Authorizations
                                </span>
                                <div className="space-y-1.5">
                                    {(ROLE_PERMISSIONS[selectedUser.role] || ["Standard Operational Access"]).map((perm, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-slate-700"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                            <span>{perm}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <Button
                                size="sm"
                                variant={selectedUser.isActive ? "secondary" : "default"}
                                onClick={() => handleToggleUserStatus(selectedUser._id)}
                                className="rounded-xl font-heading"
                            >
                                {selectedUser.isActive ? "Deactivate User" : "Activate User"}
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedUser(null)}
                                className="rounded-xl"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* ─── MODAL 2: AUDIT LOG INSPECTION MODAL ───────────────────────────── */}
            {selectedLog && (
                <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                    <DialogContent className="max-w-lg rounded-2xl p-6">
                        <DialogHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-base font-bold text-slate-900 font-heading">
                                            Audit Trace Event
                                        </DialogTitle>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${ACTION_COLORS[selectedLog.action] || "bg-slate-100 text-slate-700 border-slate-200"} font-heading`}>
                                            {selectedLog.action}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-body mt-0.5">
                                        Resource: <span className="font-mono text-sky-700 font-semibold">{selectedLog.resource}</span>
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-3.5 my-3 text-xs font-body">
                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">ACTOR</span>
                                    <span className="font-semibold text-slate-900 text-xs">
                                        {selectedLog.userName || selectedLog.user?.name || "System"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">ACTOR ROLE</span>
                                    <span className="font-medium text-slate-700 text-xs capitalize">
                                        {selectedLog.user?.role?.replace("_", " ") || "Automation"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">TIMESTAMP</span>
                                    <span className="text-slate-800 text-xs">
                                        {new Date(selectedLog.timestamp || selectedLog.createdAt || Date.now()).toLocaleString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">IP ADDRESS</span>
                                    <span className="font-mono text-slate-700 text-xs">
                                        {selectedLog.ipAddress || "127.0.0.1"}
                                    </span>
                                </div>
                            </div>

                            {/* Payload Details */}
                            {selectedLog.details && (
                                <div>
                                    <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1.5 font-heading">
                                        Operation Context & Payload
                                    </span>
                                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48">
                                        {typeof selectedLog.details === "object"
                                            ? JSON.stringify(selectedLog.details, null, 2)
                                            : String(selectedLog.details)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                variant="secondary"
                                onClick={() => setSelectedLog(null)}
                                className="rounded-xl w-full"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
