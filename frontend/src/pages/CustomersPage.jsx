import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Create modal state
    const [showModal, setShowModal] = useState(false);
    const [companyName, setCompanyName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [gstNumber, setGstNumber] = useState("");
    const [billingCity, setBillingCity] = useState("");
    const [shippingCity, setShippingCity] = useState("");

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (search) params.search = search;
            const res = await apiClient.get("/customers", { params });
            if (res.data?.success) {
                setCustomers(res.data.data.customers);
                setPagination(res.data.data.pagination);
            }
        } catch (err) {
            console.error("Failed to load customers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchCustomers();
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();

        const trimmedContact = contactPerson.trim();
        if (!/^[a-zA-Z\s]{2,50}$/.test(trimmedContact)) {
            alert("Contact Person must contain only letters and spaces (2-50 characters)");
            return;
        }

        const cleanedPhone = phone.trim();
        if (!/^\d{10}$/.test(cleanedPhone)) {
            alert("Phone number must be exactly 10 digits");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            alert("Please enter a valid email address");
            return;
        }

        if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber.trim())) {
            alert("Please enter a valid 15-character GSTIN (e.g. 27AAACA1234A1Z5)");
            return;
        }

        try {
            const payload = {
                companyName: companyName.trim(),
                contactPerson: trimmedContact,
                email: email.trim().toLowerCase(),
                phone: cleanedPhone,
                gstNumber: gstNumber ? gstNumber.trim() : undefined,
                billingAddress: { city: billingCity.trim(), country: "India" },
                shippingAddress: { city: shippingCity.trim(), country: "India" },
            };
            await apiClient.post("/customers", payload);
            alert("Customer created successfully!");
            setShowModal(false);
            setCompanyName("");
            setContactPerson("");
            setEmail("");
            setPhone("");
            setGstNumber("");
            setBillingCity("");
            setShippingCity("");
            fetchCustomers();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create customer");
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await apiClient.patch(`/customers/${id}/toggle-status`);
            alert(res.data?.message || "Status updated");
            fetchCustomers();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to toggle status");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Customers</h1>
                    <p className="text-xs text-gray-500">Manage client profiles, shipping addresses, and status</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                >
                    + Add Customer
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-3 rounded border border-gray-200">
                <form onSubmit={handleSearch} className="flex gap-2 text-xs">
                    <input
                        type="text"
                        placeholder="Search company, contact, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none w-72"
                    />
                    <button type="submit" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded font-medium">
                        Search
                    </button>
                </form>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded border border-gray-200 overflow-x-auto text-xs">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                        <tr>
                            <th className="p-3">Company</th>
                            <th className="p-3">Contact Person</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Phone</th>
                            <th className="p-3">GST Number</th>
                            <th className="p-3">City</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="p-4 text-center text-gray-500">
                                    Loading customers...
                                </td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="p-4 text-center text-gray-500">
                                    No customers found.
                                </td>
                            </tr>
                        ) : (
                            customers.map((c) => (
                                <tr key={c._id} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-medium text-gray-900">{c.companyName}</td>
                                    <td className="p-3">{c.contactPerson}</td>
                                    <td className="p-3 font-mono">{c.email}</td>
                                    <td className="p-3">{c.phone}</td>
                                    <td className="p-3 font-mono text-[11px]">{c.gstNumber || "-"}</td>
                                    <td className="p-3">{c.shippingAddress?.city || c.billingAddress?.city || "-"}</td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {c.isActive ? "ACTIVE" : "INACTIVE"}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => handleToggleStatus(c._id)}
                                            className="px-2 py-1 border rounded text-[11px] text-gray-700 hover:bg-gray-50"
                                        >
                                            Toggle Status
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <div className="flex gap-1">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                            className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page >= pagination.totalPages}
                            onClick={() => setPage(page + 1)}
                            className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Modal: Add Customer */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg border max-w-md w-full p-5 text-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h2 className="font-bold text-base text-gray-900">Add New Customer</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Company Name *</label>
                                <input
                                    required
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Acme Enterprises Ltd"
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Contact Person (Letters only) *</label>
                                <input
                                    required
                                    value={contactPerson}
                                    maxLength={50}
                                    onChange={(e) => setContactPerson(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                                    placeholder="e.g. John Doe"
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john@acme.com"
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Phone (10 Digits) *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        maxLength={10}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                        placeholder="9876543210"
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">GST Number (15 Alphanumeric)</label>
                                <input
                                    value={gstNumber}
                                    maxLength={15}
                                    onChange={(e) => setGstNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))}
                                    placeholder="27AAACA1234A1Z5"
                                    className="w-full border p-2 rounded uppercase"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Billing City</label>
                                    <input
                                        value={billingCity}
                                        onChange={(e) => setBillingCity(e.target.value)}
                                        placeholder="Mumbai"
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Shipping City</label>
                                    <input
                                        value={shippingCity}
                                        onChange={(e) => setShippingCity(e.target.value)}
                                        placeholder="Pune"
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-3 py-1.5 border rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Save Customer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
