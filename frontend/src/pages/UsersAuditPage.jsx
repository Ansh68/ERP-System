import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

export default function UsersAuditPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("users");
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await apiClient.get("/auth/users");
            if (res.data?.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load users (Admin permission required)");
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await apiClient.get("/audit-logs?limit=50");
            if (res.data?.success) {
                setAuditLogs(res.data.data.logs);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load audit logs (Admin permission required)");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "users") {
            fetchUsers();
        } else {
            fetchAuditLogs();
        }
    }, [activeTab]);

    const handleToggleUserStatus = async (userId) => {
        try {
            const res = await apiClient.patch(`/auth/users/${userId}/toggle-status`);
            alert(res.data?.message || "User status updated");
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to toggle user status");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-4">
            <div>
                <h1 className="text-xl font-bold text-gray-900">User Management & System Audit</h1>
                <p className="text-xs text-gray-500">Security management, RBAC accounts, and immutable activity logs</p>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-gray-200 text-xs font-medium space-x-2">
                <button
                    onClick={() => setActiveTab("users")}
                    className={`py-2 px-3 border-b-2 ${
                        activeTab === "users"
                            ? "border-blue-600 text-blue-600 font-bold"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    System Users & Roles
                </button>
                <button
                    onClick={() => setActiveTab("audit")}
                    className={`py-2 px-3 border-b-2 ${
                        activeTab === "audit"
                            ? "border-blue-600 text-blue-600 font-bold"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Activity Audit Log
                </button>
            </div>

            {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded text-xs">
                    {error}
                </div>
            )}

            {/* ─── TAB: USERS ─────────────────────────────────────────────────── */}
            {activeTab === "users" && (
                <div className="bg-white rounded border border-gray-200 overflow-x-auto text-xs">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Account Status</th>
                                <th className="p-3">Created</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-4 text-center text-gray-500">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-4 text-center text-gray-500">
                                        No users found or not authorized.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u._id} className="hover:bg-gray-50/50">
                                        <td className="p-3 font-medium text-gray-900">{u.name}</td>
                                        <td className="p-3 font-mono">{u.email}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                                                {u.role?.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                                    u.isActive
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {u.isActive ? "ACTIVE" : "DEACTIVATED"}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-500">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleToggleUserStatus(u._id)}
                                                className="px-2 py-1 border rounded text-[11px] text-gray-700 hover:bg-gray-50"
                                            >
                                                {u.isActive ? "Deactivate" : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── TAB: AUDIT LOGS ────────────────────────────────────────────── */}
            {activeTab === "audit" && (
                <div className="bg-white rounded border border-gray-200 overflow-x-auto text-xs">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b">
                            <tr>
                                <th className="p-3">Timestamp</th>
                                <th className="p-3">Action</th>
                                <th className="p-3">Resource</th>
                                <th className="p-3">User</th>
                                <th className="p-3">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-4 text-center text-gray-500">
                                        Loading audit logs...
                                    </td>
                                </tr>
                            ) : auditLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-4 text-center text-gray-500">
                                        No audit entries logged yet.
                                    </td>
                                </tr>
                            ) : (
                                auditLogs.map((log) => (
                                    <tr key={log._id} className="hover:bg-gray-50/50">
                                        <td className="p-3 text-gray-500 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-3 font-semibold text-gray-900">{log.action}</td>
                                        <td className="p-3 font-mono text-[11px] text-blue-700">{log.resource}</td>
                                        <td className="p-3 font-medium">{log.userName || log.user?.name || "System"}</td>
                                        <td className="p-3 font-mono text-gray-400">{log.ipAddress || "127.0.0.1"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
