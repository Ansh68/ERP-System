import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const { login, register, demoLogin } = useAuth();
    const navigate = useNavigate();

    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("sales_executive");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (isRegister) {
            if (!name.trim() || !/^[a-zA-Z\s]{2,50}$/.test(name.trim())) {
                setError("Full name must contain only letters and spaces (2-50 characters)");
                return;
            }
        }

        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("Please enter a valid email address");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);

        try {
            if (isRegister) {
                await register(name.trim(), email.trim(), password, role);
                alert("Registration successful! Logging you in...");
                await login(email.trim(), password);
            } else {
                await login(email.trim(), password);
            }
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickRoleLogin = async (roleEmail) => {
        setError("");
        setLoading(true);
        try {
            await demoLogin(roleEmail);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to log in with role account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">FloData ERP</h1>
                    <p className="text-sm text-gray-500 mt-1">Lightweight Functional Testing Console</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                        {error}
                    </div>
                )}

                <div className="flex border-b border-gray-200 mb-5">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(false);
                            setError("");
                        }}
                        className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                            !isRegister ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(true);
                            setError("");
                        }}
                        className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                            isRegister ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
                        }`}
                    >
                        Register New User
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Full Name (Letters only) *
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                                placeholder="e.g. John Doe"
                                maxLength={50}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@flodata.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password@123"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {isRegister && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Assign Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                                <option value="admin">Admin (Full Access)</option>
                                <option value="sales_executive">Sales Executive</option>
                                <option value="inventory_manager">Inventory Manager</option>
                                <option value="production_manager">Production Manager</option>
                                <option value="quality_inspector">Quality Inspector</option>
                                <option value="dispatch_manager">Dispatch Manager</option>
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-sm transition-colors"
                    >
                        {loading ? "Processing..." : isRegister ? "Create Account & Sign In" : "Sign In"}
                    </button>
                </form>

                {/* Quick Role Buttons for Testing */}
                {!isRegister && (
                    <div className="mt-6 pt-5 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Quick 1-Click Role Login:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => handleQuickRoleLogin("admin@flodata.com")}
                                className="p-2 border border-gray-200 rounded hover:bg-gray-50 text-left"
                            >
                                <span className="font-semibold block text-gray-800">Admin</span>
                                <span className="text-gray-500 text-[10px]">admin@flodata.com</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickRoleLogin("sales@flodata.com")}
                                className="p-2 border border-gray-200 rounded hover:bg-gray-50 text-left"
                            >
                                <span className="font-semibold block text-gray-800">Sales Exec</span>
                                <span className="text-gray-500 text-[10px]">sales@flodata.com</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickRoleLogin("inventory@flodata.com")}
                                className="p-2 border border-gray-200 rounded hover:bg-gray-50 text-left"
                            >
                                <span className="font-semibold block text-gray-800">Inventory Mgr</span>
                                <span className="text-gray-500 text-[10px]">inventory@flodata.com</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickRoleLogin("production@flodata.com")}
                                className="p-2 border border-gray-200 rounded hover:bg-gray-50 text-left"
                            >
                                <span className="font-semibold block text-gray-800">Production Mgr</span>
                                <span className="text-gray-500 text-[10px]">production@flodata.com</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickRoleLogin("qc@flodata.com")}
                                className="p-2 border border-gray-200 rounded hover:bg-gray-50 text-left"
                            >
                                <span className="font-semibold block text-gray-800">Quality Inspector</span>
                                <span className="text-gray-500 text-[10px]">qc@flodata.com</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickRoleLogin("dispatch@flodata.com")}
                                className="p-2 border border-gray-200 rounded hover:bg-gray-50 text-left"
                            >
                                <span className="font-semibold block text-gray-800">Dispatch Mgr</span>
                                <span className="text-gray-500 text-[10px]">dispatch@flodata.com</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
