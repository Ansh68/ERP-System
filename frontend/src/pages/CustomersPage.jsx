import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import {
    Users,
    Search,
    Plus,
    Building2,
    Mail,
    Phone,
    MapPin,
    FileText,
    CheckCircle2,
    XCircle,
    Edit3,
    Eye,
    ChevronLeft,
    ChevronRight,
    RotateCw,
    X,
    Shield,
    Calendar,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/Dialog";
import { Skeleton } from "../components/ui/Skeleton";

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Modal state: Create Customer
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createForm, setCreateForm] = useState({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        gstNumber: "",
        billingCity: "",
        billingState: "",
        shippingCity: "",
        shippingState: "",
    });

    // Modal state: View / Edit Customer Details
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);

    const fetchCustomers = async (searchOverride) => {
        setLoading(true);
        try {
            const querySearch = searchOverride !== undefined ? searchOverride : search;
            const params = { page, limit: 10 };
            if (querySearch && querySearch.trim()) {
                params.search = querySearch.trim();
            }
            if (statusFilter === "active") {
                params.status = "active";
                params.isActive = "true";
            } else if (statusFilter === "inactive") {
                params.status = "inactive";
                params.isActive = "false";
            }

            const res = await apiClient.get("/customers", { params });
            if (res.data?.success) {
                setCustomers(res.data.data.customers);
                setPagination(res.data.data.pagination);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [page, statusFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchCustomers(search);
    };

    // Open detail modal for clicked customer
    const handleViewCustomer = async (cust) => {
        setSelectedCustomer(cust);
        setIsEditing(false);
        setEditForm({
            companyName: cust.companyName || "",
            contactPerson: cust.contactPerson || "",
            email: cust.email || "",
            phone: cust.phone || "",
            gstNumber: cust.gstNumber || "",
            billingCity: cust.billingAddress?.city || "",
            billingState: cust.billingAddress?.state || "",
            shippingCity: cust.shippingAddress?.city || "",
            shippingState: cust.shippingAddress?.state || "",
        });
    };

    // Create Customer
    const handleCreateCustomer = async (e) => {
        e.preventDefault();

        const trimmedContact = createForm.contactPerson.trim();
        if (!/^[a-zA-Z\s]{2,50}$/.test(trimmedContact)) {
            toast.error("Contact Person must contain only letters and spaces (2-50 characters)");
            return;
        }

        const cleanedPhone = createForm.phone.trim();
        if (!/^\d{10}$/.test(cleanedPhone)) {
            toast.error("Phone number must be exactly 10 digits");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
            toast.error("Please enter a valid corporate email address");
            return;
        }

        if (createForm.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(createForm.gstNumber.trim())) {
            toast.error("Please enter a valid 15-character GSTIN (e.g. 27AAACA1234A1Z5)");
            return;
        }

        setCreateLoading(true);
        const actionToast = toast.loading("Registering customer...");

        try {
            const payload = {
                companyName: createForm.companyName.trim(),
                contactPerson: trimmedContact,
                email: createForm.email.trim().toLowerCase(),
                phone: cleanedPhone,
                gstNumber: createForm.gstNumber ? createForm.gstNumber.trim().toUpperCase() : undefined,
                billingAddress: {
                    city: createForm.billingCity.trim() || undefined,
                    state: createForm.billingState.trim() || undefined,
                    country: "India",
                },
                shippingAddress: {
                    city: createForm.shippingCity.trim() || undefined,
                    state: createForm.shippingState.trim() || undefined,
                    country: "India",
                },
            };

            await apiClient.post("/customers", payload);
            toast.success("Customer account registered successfully!", { id: actionToast });
            setShowCreateModal(false);
            setCreateForm({
                companyName: "",
                contactPerson: "",
                email: "",
                phone: "",
                gstNumber: "",
                billingCity: "",
                billingState: "",
                shippingCity: "",
                shippingState: "",
            });
            fetchCustomers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create customer", { id: actionToast });
        } finally {
            setCreateLoading(false);
        }
    };

    // Update Customer details
    const handleUpdateCustomer = async (e) => {
        e.preventDefault();
        if (!selectedCustomer) return;

        const trimmedContact = editForm.contactPerson.trim();
        if (!/^[a-zA-Z\s]{2,50}$/.test(trimmedContact)) {
            toast.error("Contact Person must contain only letters and spaces (2-50 characters)");
            return;
        }

        const cleanedPhone = editForm.phone.trim();
        if (!/^\d{10}$/.test(cleanedPhone)) {
            toast.error("Phone number must be exactly 10 digits");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
            toast.error("Please enter a valid corporate email address");
            return;
        }

        if (editForm.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(editForm.gstNumber.trim())) {
            toast.error("Please enter a valid 15-character GSTIN (e.g. 27AAACA1234A1Z5)");
            return;
        }

        setEditLoading(true);
        const actionToast = toast.loading("Updating customer profile...");

        try {
            const payload = {
                companyName: editForm.companyName.trim(),
                contactPerson: trimmedContact,
                email: editForm.email.trim().toLowerCase(),
                phone: cleanedPhone,
                gstNumber: editForm.gstNumber ? editForm.gstNumber.trim().toUpperCase() : undefined,
                billingAddress: {
                    city: editForm.billingCity.trim() || undefined,
                    state: editForm.billingState.trim() || undefined,
                    country: "India",
                },
                shippingAddress: {
                    city: editForm.shippingCity.trim() || undefined,
                    state: editForm.shippingState.trim() || undefined,
                    country: "India",
                },
            };

            const res = await apiClient.patch(`/customers/${selectedCustomer._id}`, payload);
            toast.success("Customer profile updated successfully!", { id: actionToast });
            setIsEditing(false);
            if (res.data?.data) {
                setSelectedCustomer(res.data.data);
            }
            fetchCustomers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update customer", { id: actionToast });
        } finally {
            setEditLoading(false);
        }
    };

    // Toggle Active / Inactive Status
    const handleToggleStatus = async (id, e) => {
        if (e) e.stopPropagation();
        const actionToast = toast.loading("Updating customer status...");
        try {
            const res = await apiClient.patch(`/customers/${id}/toggle-status`);
            toast.success(res.data?.message || "Status updated", { id: actionToast });
            if (selectedCustomer && selectedCustomer._id === id) {
                setSelectedCustomer({
                    ...selectedCustomer,
                    isActive: !selectedCustomer.isActive,
                });
            }
            fetchCustomers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to toggle status", { id: actionToast });
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight">
                            Customer Directory
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 font-medium">
                            {pagination.total || customers.length} Accounts
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-body mt-0.5">
                        Manage corporate client accounts, billing entities, and shipping addresses
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-xl gap-2 font-heading"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Customer</span>
                    </Button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <Card className="rounded-2xl">
                <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
                        <div className="relative flex-1">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search by company, contact, or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9.5 text-xs rounded-xl"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="rounded-xl font-heading">
                            Search
                        </Button>
                    </form>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-heading">
                        {[
                            { key: "all", label: "All" },
                            { key: "active", label: "Active" },
                            { key: "inactive", label: "Inactive" },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => {
                                    setStatusFilter(t.key);
                                    setPage(1);
                                }}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                                    statusFilter === t.key
                                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Customers Table */}
            <Card className="rounded-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-body">
                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3 font-semibold font-heading">Company & Contact</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Email Address</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Phone (10-Digit)</th>
                                    <th className="px-5 py-3 font-semibold font-heading">GSTIN</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Location</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Account Status</th>
                                    <th className="px-5 py-3 text-right font-semibold font-heading">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={7} className="px-5 py-3.5">
                                                <Skeleton className="h-5 w-full rounded" />
                                            </td>
                                        </tr>
                                    ))
                                ) : customers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                                            No customers found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map((c) => (
                                        <tr
                                            key={c._id}
                                            onClick={() => handleViewCustomer(c)}
                                            className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs font-heading shrink-0">
                                                        {c.companyName ? c.companyName.slice(0, 2).toUpperCase() : "CO"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-semibold text-slate-900 group-hover:text-sky-600 font-heading block truncate">
                                                            {c.companyName}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 block truncate">
                                                            Attn: {c.contactPerson}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 font-mono text-slate-600">
                                                {c.email}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-700 font-medium">
                                                {c.phone}
                                            </td>
                                            <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                                                {c.gstNumber || "—"}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600">
                                                {c.shippingAddress?.city || c.billingAddress?.city || "India"}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Badge
                                                    variant={c.isActive ? "success" : "slate"}
                                                    className="text-[10px]"
                                                >
                                                    {c.isActive ? "ACTIVE" : "INACTIVE"}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewCustomer(c)}
                                                        className="h-7 px-2 text-[11px] rounded-lg text-slate-600 hover:text-sky-600"
                                                        title="View & Edit Profile"
                                                    >
                                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => handleToggleStatus(c._id, e)}
                                                        className="h-7 px-2 text-[10.5px] rounded-lg"
                                                    >
                                                        {c.isActive ? "Deactivate" : "Activate"}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-body">
                            <span>
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} accounts)
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                    className="h-8 rounded-lg text-xs"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="h-8 rounded-lg text-xs"
                                >
                                    Next
                                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ─── MODAL: CREATE CUSTOMER ────────────────────────────────────────── */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent onClose={() => setShowCreateModal(false)} className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                        <DialogDescription>
                            Create a new verified commercial entity with GST details and delivery destinations
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateCustomer} className="space-y-3.5">
                        <div>
                            <Label htmlFor="createCompanyName">Company Name *</Label>
                            <Input
                                id="createCompanyName"
                                required
                                value={createForm.companyName}
                                onChange={(e) =>
                                    setCreateForm({ ...createForm, companyName: e.target.value })
                                }
                                placeholder="Acme Manufacturing Ltd"
                            />
                        </div>

                        <div>
                            <Label htmlFor="createContactPerson">Contact Person (Letters only) *</Label>
                            <Input
                                id="createContactPerson"
                                required
                                maxLength={50}
                                value={createForm.contactPerson}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        contactPerson: e.target.value.replace(/[^a-zA-Z\s]/g, ""),
                                    })
                                }
                                placeholder="e.g. John Doe"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="createEmail">Email Address *</Label>
                                <Input
                                    id="createEmail"
                                    type="email"
                                    required
                                    value={createForm.email}
                                    onChange={(e) =>
                                        setCreateForm({ ...createForm, email: e.target.value })
                                    }
                                    placeholder="john@acme.com"
                                />
                            </div>
                            <div>
                                <Label htmlFor="createPhone">Phone (10 Digits) *</Label>
                                <Input
                                    id="createPhone"
                                    type="tel"
                                    required
                                    maxLength={10}
                                    value={createForm.phone}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                                        })
                                    }
                                    placeholder="9876543210"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="createGst">GST Number (Optional)</Label>
                                <span className="text-[10.5px] text-slate-400">15 Alphanumeric</span>
                            </div>
                            <Input
                                id="createGst"
                                maxLength={15}
                                value={createForm.gstNumber}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        gstNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15),
                                    })
                                }
                                placeholder="27AAACA1234A1Z5"
                                className="uppercase font-mono text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="createBillCity">Billing City</Label>
                                <Input
                                    id="createBillCity"
                                    value={createForm.billingCity}
                                    onChange={(e) =>
                                        setCreateForm({ ...createForm, billingCity: e.target.value })
                                    }
                                    placeholder="Mumbai"
                                />
                            </div>
                            <div>
                                <Label htmlFor="createShipCity">Shipping City</Label>
                                <Input
                                    id="createShipCity"
                                    value={createForm.shippingCity}
                                    onChange={(e) =>
                                        setCreateForm({ ...createForm, shippingCity: e.target.value })
                                    }
                                    placeholder="Pune"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowCreateModal(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createLoading}
                                size="sm"
                                className="rounded-xl font-heading"
                            >
                                {createLoading ? "Saving..." : "Save Customer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── MODAL: VIEW & UPDATE CUSTOMER DETAILS ─────────────────────── */}
            {selectedCustomer && (
                <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
                    <DialogContent onClose={() => setSelectedCustomer(null)} className="max-w-lg">
                        <DialogHeader>
                            <div className="flex items-center justify-between pr-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold font-heading">
                                        {selectedCustomer.companyName ? selectedCustomer.companyName.slice(0, 2).toUpperCase() : "CU"}
                                    </div>
                                    <div>
                                        <DialogTitle>{selectedCustomer.companyName}</DialogTitle>
                                        <DialogDescription>
                                            Customer ID: <span className="font-mono">{selectedCustomer._id}</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                                <Badge variant={selectedCustomer.isActive ? "success" : "slate"}>
                                    {selectedCustomer.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </DialogHeader>

                        {/* Toggle between View Mode and Edit Mode */}
                        {!isEditing ? (
                            <div className="space-y-4 text-xs font-body">
                                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[11px] text-slate-400 block font-medium">Contact Person</span>
                                        <span className="text-slate-800 font-semibold font-heading text-sm">
                                            {selectedCustomer.contactPerson}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 block font-medium">Phone Number</span>
                                        <span className="text-slate-800 font-medium">
                                            {selectedCustomer.phone}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 block font-medium">Email Address</span>
                                        <span className="text-slate-800 font-mono">
                                            {selectedCustomer.email}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 block font-medium">GSTIN</span>
                                        <span className="text-slate-800 font-mono">
                                            {selectedCustomer.gstNumber || "Not Registered"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl border border-slate-100 bg-white">
                                        <span className="text-[11px] text-slate-400 block font-medium uppercase font-heading mb-1">
                                            Billing Destination
                                        </span>
                                        <p className="text-slate-700">
                                            {selectedCustomer.billingAddress?.city || "City not set"}
                                            {selectedCustomer.billingAddress?.state ? `, ${selectedCustomer.billingAddress.state}` : ""}
                                        </p>
                                        <p className="text-slate-400 text-[11px]">
                                            {selectedCustomer.billingAddress?.country || "India"}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-slate-100 bg-white">
                                        <span className="text-[11px] text-slate-400 block font-medium uppercase font-heading mb-1">
                                            Shipping Destination
                                        </span>
                                        <p className="text-slate-700">
                                            {selectedCustomer.shippingAddress?.city || "City not set"}
                                            {selectedCustomer.shippingAddress?.state ? `, ${selectedCustomer.shippingAddress.state}` : ""}
                                        </p>
                                        <p className="text-slate-400 text-[11px]">
                                            {selectedCustomer.shippingAddress?.country || "India"}
                                        </p>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleStatus(selectedCustomer._id)}
                                        className="rounded-xl mr-auto"
                                    >
                                        {selectedCustomer.isActive ? "Mark Inactive" : "Mark Active"}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSelectedCustomer(null)}
                                        className="rounded-xl"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                        className="rounded-xl font-heading gap-1.5"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        <span>Edit Customer</span>
                                    </Button>
                                </DialogFooter>
                            </div>
                        ) : (
                            /* Edit Mode Form */
                            <form onSubmit={handleUpdateCustomer} className="space-y-3.5">
                                <div>
                                    <Label htmlFor="editCompanyName">Company Name *</Label>
                                    <Input
                                        id="editCompanyName"
                                        required
                                        value={editForm.companyName}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, companyName: e.target.value })
                                        }
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="editContactPerson">Contact Person *</Label>
                                    <Input
                                        id="editContactPerson"
                                        required
                                        maxLength={50}
                                        value={editForm.contactPerson}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                contactPerson: e.target.value.replace(/[^a-zA-Z\s]/g, ""),
                                            })
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="editEmail">Email Address *</Label>
                                        <Input
                                            id="editEmail"
                                            type="email"
                                            required
                                            value={editForm.email}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, email: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editPhone">Phone (10 Digits) *</Label>
                                        <Input
                                            id="editPhone"
                                            type="tel"
                                            required
                                            maxLength={10}
                                            value={editForm.phone}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="editGst">GST Number (15 Alphanumeric)</Label>
                                    <Input
                                        id="editGst"
                                        maxLength={15}
                                        value={editForm.gstNumber}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                gstNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15),
                                            })
                                        }
                                        className="uppercase font-mono text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="editBillCity">Billing City</Label>
                                        <Input
                                            id="editBillCity"
                                            value={editForm.billingCity}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, billingCity: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editShipCity">Shipping City</Label>
                                        <Input
                                            id="editShipCity"
                                            value={editForm.shippingCity}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, shippingCity: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setIsEditing(false)}
                                        className="rounded-xl"
                                    >
                                        Cancel Edit
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={editLoading}
                                        size="sm"
                                        className="rounded-xl font-heading"
                                    >
                                        {editLoading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
