import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Boxes,
    Package,
    Factory,
    ShieldCheck,
    Truck,
    BarChart3,
    Shield,
    LogOut,
    Menu,
    X,
    Sparkles,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    Bell,
    CheckCircle2,
} from "lucide-react";
import { Badge } from "./ui/Badge";
import UserProfileModal from "./UserProfileModal";

export default function AppLayout({ children }) {
    const { user, logout, demoLogin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Profile modal
    const [profileOpen, setProfileOpen] = useState(false);

    // Collapsible sidebar state (persisted in localStorage for convenience)
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem("flodata_sidebar_collapsed") === "true";
    });
    const [mobileOpen, setMobileOpen] = useState(false);
    const [switchingRole, setSwitchingRole] = useState(false);

    useEffect(() => {
        localStorage.setItem("flodata_sidebar_collapsed", collapsed);
    }, [collapsed]);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully");
            navigate("/login");
        } catch (err) {
            toast.error("Logout failed. Please try again.");
        }
    };

    const handleRoleSwitch = async (roleEmail, roleTitle) => {
        setSwitchingRole(true);
        const loadingToast = toast.loading(`Switching to ${roleTitle}...`);
        try {
            await demoLogin(roleEmail);
            toast.success(`Switched role to ${roleTitle}`, { id: loadingToast });
            window.location.reload();
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to switch to ${roleTitle}`, {
                id: loadingToast,
            });
            setSwitchingRole(false);
        }
    };

    // Role-based permissions mapping
    const rolePermissions = {
        admin: [
            "/",
            "/orders",
            "/customers",
            "/raw-materials",
            "/products",
            "/production",
            "/qc",
            "/dispatch",
            "/reports",
            "/audit",
        ],
        sales_executive: ["/", "/orders", "/customers", "/reports"],
        inventory_manager: ["/", "/raw-materials", "/products", "/reports"],
        production_manager: ["/", "/products", "/production", "/reports"],
        quality_inspector: ["/", "/qc", "/reports"],
        dispatch_manager: ["/", "/dispatch", "/reports"],
    };

    const userAllowedPaths = user ? rolePermissions[user.role] || ["/"] : ["/"];

    const navLinks = [
        { path: "/", label: "Dashboard", icon: LayoutDashboard },
        { path: "/orders", label: "Sales Orders", icon: ShoppingCart },
        { path: "/customers", label: "Customers", icon: Users },
        { path: "/raw-materials", label: "Raw Materials", icon: Boxes },
        { path: "/products", label: "Products & BOM", icon: Package },
        { path: "/production", label: "Production", icon: Factory },
        { path: "/qc", label: "Quality Control", icon: ShieldCheck },
        { path: "/dispatch", label: "Dispatch", icon: Truck },
        { path: "/reports", label: "Reports", icon: BarChart3 },
        { path: "/audit", label: "Users & Audit", icon: Shield },
    ];

    const visibleLinks = navLinks.filter((link) => userAllowedPaths.includes(link.path));

    const roleBadges = {
        admin: { label: "Admin", variant: "purple" },
        sales_executive: { label: "Sales Exec", variant: "default" },
        inventory_manager: { label: "Inventory", variant: "indigo" },
        production_manager: { label: "Production", variant: "warning" },
        quality_inspector: { label: "QC Inspector", variant: "success" },
        dispatch_manager: { label: "Dispatch", variant: "slate" },
    };

    const currentBadge = roleBadges[user?.role] || { label: user?.role || "User", variant: "slate" };

    const quickRoles = [
        { title: "Admin", email: "admin@flodata.com", roleKey: "admin" },
        { title: "Sales", email: "sales@flodata.com", roleKey: "sales_executive" },
        { title: "Inventory", email: "inventory@flodata.com", roleKey: "inventory_manager" },
        { title: "Prod", email: "production@flodata.com", roleKey: "production_manager" },
        { title: "QC", email: "qc@flodata.com", roleKey: "quality_inspector" },
        { title: "Dispatch", email: "dispatch@flodata.com", roleKey: "dispatch_manager" },
    ];

    const currentSection = navLinks.find((l) => l.path === location.pathname)?.label || "Dashboard";

    return (
        <div className="min-h-screen bg-[#f4f6f8] flex flex-col md:flex-row font-body antialiased text-slate-800">
            {/* Mobile Top Bar */}
            <header className="md:hidden bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        V
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-900 font-heading leading-tight">
                            FloData
                        </h1>
                        <p className="text-[10px] text-slate-400 font-medium">ERP Solution</p>
                    </div>
                </div>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </header>

            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 transition-opacity"
                />
            )}

            {/* Left Sidebar */}
            <aside
                className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-200 ease-in-out md:translate-x-0 ${
                    mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
                } ${collapsed ? "md:w-20" : "md:w-64"}`}
            >
                {/* Brand Header & Collapse Toggle */}
                <div className={`p-4 border-b border-slate-100 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        {/* Vantus-inspired geometric icon mark */}
                        {!collapsed && (
                            <div className="min-w-0">
                                <h1 className="font-heading font-bold text-slate-900 text-base tracking-tight leading-none">
                                    FloData
                                </h1>
                                <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">
                                    ERP Solution
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Open / Close Collapse Toggle Button (« / ») */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden md:inline-flex p-1.5 rounded-lg border border-slate-200/70 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? (
                            <ChevronsRight className="h-4 w-4" />
                        ) : (
                            <ChevronsLeft className="h-4 w-4" />
                        )}
                    </button>

                    {/* Mobile close button */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {!collapsed && (
                        <div className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
                            Main
                        </div>
                    )}

                    {visibleLinks.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                title={collapsed ? item.label : undefined}
                                className={`group flex items-center ${
                                    collapsed ? "justify-center p-2.5" : "justify-between px-3.5 py-2.5"
                                } rounded-xl text-sm transition-all duration-150 ${
                                    isActive
                                        ? "bg-sky-500 text-white font-medium shadow-xs shadow-sky-500/20"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon
                                        className={`h-4.5 w-4.5 transition-colors ${
                                            isActive
                                                ? "text-white"
                                                : "text-slate-400 group-hover:text-slate-600"
                                        }`}
                                    />
                                    {!collapsed && (
                                        <span className="font-heading text-[13.5px]">{item.label}</span>
                                    )}
                                </div>
                                {!collapsed && (
                                    <ChevronRight
                                        className={`h-3.5 w-3.5 transition-opacity ${
                                            isActive
                                                ? "text-white opacity-90"
                                                : "text-slate-300 opacity-60 group-hover:opacity-100"
                                        }`}
                                    />
                                )}
                            </Link>
                        );
                    })}

                    {/* Quick Role Switcher (Compact, Clean) */}
                    {!collapsed && (
                        <div className="pt-4 mt-4 border-t border-slate-100">
                            <div className="px-3 pb-2 flex items-center justify-between">
                                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 font-heading flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3 text-amber-500" />
                                    Switch Role
                                </span>
                                <span className="text-[10px] text-slate-400">Dev</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 px-1">
                                {quickRoles.map((r) => {
                                    const isCurrent = user?.role === r.roleKey;
                                    return (
                                        <button
                                            key={r.roleKey}
                                            disabled={switchingRole}
                                            onClick={() => handleRoleSwitch(r.email, r.title)}
                                            className={`px-1.5 py-1 text-[11px] font-medium rounded-lg border transition-colors text-center cursor-pointer ${
                                                isCurrent
                                                    ? "bg-sky-50 text-sky-700 border-sky-300 font-semibold"
                                                    : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                            title={`Login as ${r.title}`}
                                        >
                                            {r.title}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile Card & Sign Out (Emma Johnson style) */}
                <div className="p-3 border-t border-slate-100 bg-white">
                    <div
                        className={`flex items-center ${
                            collapsed ? "justify-center" : "justify-between"
                        } p-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer`}
                    >
                        <div
                            onClick={() => setProfileOpen(true)}
                            className="flex items-center gap-2.5 min-w-0 flex-1"
                            title="Click to view your profile"
                        >
                            <div className="h-8.5 w-8.5 rounded-full bg-gradient-to-tr from-amber-100 to-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-300/50">
                                {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
                            </div>
                            {!collapsed && (
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 truncate font-heading leading-tight group-hover:text-sky-600">
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                                        {user?.email || "user@flodata.com"}
                                    </p>
                                </div>
                            )}
                        </div>

                        {!collapsed && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLogout();
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                                title="Sign out"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* User Profile Modal */}
            <UserProfileModal open={profileOpen} onOpenChange={setProfileOpen} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Desktop Top Header Bar (Vantus style) */}
                <header className="hidden md:flex bg-white border-b border-slate-200/80 px-8 py-3.5 items-center justify-between sticky top-0 z-30">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-body">
                        <span className="text-slate-400 font-medium">FloData ERP</span>
                        <span>/</span>
                        <span className="font-semibold text-slate-800">{currentSection}</span>
                    </div>

                    {/* Right utility items */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active Session: {currentBadge.label}
                        </div>
                    </div>
                </header>

                {/* Page Viewport */}
                <main className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
