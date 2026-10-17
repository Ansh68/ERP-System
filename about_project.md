# Full-Stack Development Assignment - Manufacturing Order Processing & Production Management System[cite: 1]

---

## Problem Statement[cite: 1]
You are developing a full-stack Manufacturing Order Processing & Production Management System for a manufacturing company that produces finished goods from raw materials.[cite: 1]

The system should enable different departments—including Sales, Inventory, Production, Quality Control, and Dispatch—to collaborate through a centralized platform while maintaining secure role-based access control.[cite: 1]

When a customer places an order, the application should guide it through the complete manufacturing lifecycle, including inventory verification, production planning, material allocation, manufacturing, quality inspection, and final dispatch.[cite: 1]

The project must demonstrate full-stack capabilities, covering frontend UI/UX, backend API development, database integration, secure authentication, and role-based authorization while simulating real-world manufacturing workflows.[cite: 1]

---

## What We Expect From You[cite: 1]
We're looking for a working prototype of a Manufacturing ERP System that demonstrates how different departments work together within a manufacturing organization.[cite: 1]

Your solution should focus on developing both frontend and backend components while implementing secure authentication, role-based permissions, inventory tracking, production planning, and order lifecycle management.[cite: 1]

---

## Features to Implement[cite: 1]

### • Frontend (React.js)[cite: 1]
* Dashboard with role-specific modules[cite: 1]
* Login and authentication screens[cite: 1]
* Responsive UI for all modules[cite: 1]
* Protected routes based on user role[cite: 1]
* Global search for Orders, Products, and Customers[cite: 1]
* Status indicators for Orders and Production[cite: 1]
* Dashboard cards with business statistics[cite: 1]

### • Authentication & Authorization[cite: 1]
* Secure Login using JWT Authentication[cite: 1]
* Refresh Token implementation[cite: 1]
* Password hashing using bcrypt[cite: 1]
* Role-Based Access Control (RBAC)[cite: 1]
* Protected APIs[cite: 1]
* Role-based navigation menu[cite: 1]
* **Supported Roles:** Admin, Sales Executive, Inventory Manager, Production Manager, Quality Inspector, Dispatch Manager[cite: 1]

#### Example Permissions[cite: 1]

| Role | Permissions |
| :--- | :--- |
| **Admin** | Full System Access |[cite: 1]
| **Sales Executive** | Customer Management, Order Creation, Order Tracking |[cite: 1]
| **Inventory Manager** | Inventory Management, Material Issue, Stock Reports |[cite: 2]
| **Production Manager** | Production Planning, Manufacturing Updates |[cite: 2]
| **Quality Inspector** | QC Inspection, Approve/Reject Products |[cite: 2]
| **Dispatch Manager** | Shipment Planning, Dispatch Orders |[cite: 2]

---

### • Customer Management[cite: 2]
* **Actions:** Create Customer, Edit Customer, View Customer Profile, Customer Search, Active / Inactive Status[cite: 2]
* **Customer Information:** Company Name, Contact Person, Email, Phone, Billing Address, Shipping Address, GST Number[cite: 2]

---

### • Product Management[cite: 2]
* **Manage Finished Products:** Product Code, Product Name, Product Category, Unit Selling Price, Bill of Materials (BOM)[cite: 2]
* **Example BOM (Chair):** Steel Pipe x 2, Screw x 8, Seat Cushion x 1[cite: 2]

---

### • Inventory Management[cite: 2]
* **Manage Raw Materials:** Add Stock, Update Stock, Warehouse Management, Minimum Stock Level, Reorder Level, Reserved Quantity, Available Quantity[cite: 2]
* **Manage Finished Goods:** Batch Number, Warehouse Quantity, Manufacturing Date[cite: 2]
* **Inventory Transactions:** Purchase, Material Issue, Production, Adjustment, Dispatch, Return[cite: 2]
* Low Stock notifications should be displayed on the dashboard.[cite: 2]

---

### • Sales Order Management[cite: 2]
* **Sales Executive can:** Create Customer Orders, Update Orders, Cancel Orders, View Order History[cite: 2]
* **Order Information:** Customer, Products, Quantity, Expected Delivery Date, Priority, Remarks[cite: 2]
* **Order Status:**  
  Draft → Approved → Inventory Check → Production Planned → In Production → Quality Check → Ready for Dispatch → Dispatched → Delivered[cite: 2]

---

### • Inventory Validation[cite: 2]
When an order is approved, the system should automatically verify inventory.[cite: 2]
* **If Finished Goods are available:** Reserve Inventory → Skip Production[cite: 2]
* **Otherwise:** Generate Production Requirement → Reserve Raw Materials → Forward Order to Production[cite: 2]

---

### • Production Planning[cite: 2]
* **Production Manager can:** Create Production Plans, Assign Machines, Assign Supervisors, Define Production Schedule, Track Progress[cite: 2]
* **Production Plan Details:** Production Order Number, Related Sales Order, Product, Quantity, Machine, Shift, Start Date, End Date, Supervisor[cite: 2]

---

### • Material Requirement Planning (MRP)[cite: 3]
The system should automatically calculate required raw materials using the Product BOM.[cite: 3]

**Example Order Quantity: 500 Chairs**[cite: 3]

| Material | Required Qty |
| :--- | :--- |
| Steel Pipes | 1000 |[cite: 3]
| Screws | 4000 |[cite: 3]
| Seats | 500 |[cite: 3]

The application should identify shortages before production begins.[cite: 3]

---

### • Manufacturing Execution[cite: 3]
* **Stages:** Planned → Material Issued → Manufacturing → Assembly → Packaging → Completed[cite: 3]
* **Track:** Produced Quantity, Rejected Quantity, Machine Used, Operator, Production Time[cite: 3]

---

### • Quality Control[cite: 3]
* **Quality Inspector should:** Inspect Finished Goods, Approve Production, Reject Defective Products, Return Failed Products for Rework[cite: 3]
* **Inspection Details:** Visual Inspection, Dimensions, Weight, Finish, Remarks[cite: 3]
* **Status:** Passed, Failed, Rework Required[cite: 3]

---

### • Dispatch Management[cite: 3]
* **Dispatch Team can:** View Ready Orders, Create Dispatch, Generate Shipment Details, Mark Orders as Delivered[cite: 3]
* **Dispatch Information:** Vehicle, Driver, Courier, Dispatch Date, Tracking Number, Invoice Number[cite: 3]
* Inventory should automatically decrease after successful dispatch.[cite: 3]

---

### • Dashboard & Reports[cite: 3]
* **Dashboard displays:** Total Orders, Pending Orders, Running Production, Low Stock Materials, Inventory Value, Orders Ready for Dispatch, Revenue Summary, Today's Production[cite: 3]
* **Reports:** Sales Report, Inventory Report, Production Report, Material Consumption Report, Dispatch Report, Low Stock Report[cite: 3]

---

### • Audit Logs[cite: 3]
* Maintain complete activity logs.[cite: 3]
* **Examples:** User Login, Order Created, Inventory Updated, Production Started, QC Approved, Order Dispatched[cite: 3]
* **Each log should contain:** User, Action, Timestamp, IP Address[cite: 3]

---

## • Demo Data & Reasoning[cite: 3]
Populate the Manufacturing ERP with realistic demo data.[cite: 3]

### Demo Data Requirements[cite: 3]
* Create approximately 100 distinct SKUs with product details and Bills of Materials (BOMs)[cite: 4]
* Create at least 1,000 sales orders linked to customers and products[cite: 4]
* Ensure 800 sales orders have been dispatched, with linked shipment details and corresponding inventory transactions[cite: 4]
* Implement a fake carrier service to simulate shipment creation, tracking numbers, shipment status updates, and delivery confirmation[cite: 4]
* Distribute the remaining sales orders across relevant lifecycle stages to demonstrate inventory validation, production planning, manufacturing, quality control, and pending dispatch[cite: 4]
* Keep quantities, stock movements, production records, QC results, shipment records, and dates consistent with the order lifecycle[cite: 4]

### Explain Your Data Reasoning[cite: 4]
* Explain why you chose the products, customers, order quantities, dates, and order status distribution used in the demo data[cite: 4]
* Describe the scenarios your data demonstrates, including available finished goods, raw material shortages, production requirements, QC failures, and dispatch processing[cite: 4]
* Explain how related records remain consistent and how the fake carrier service fits into the dispatch workflow[cite: 4]
* Include demo data generation or seed instructions and your reasoning in `README.md`[cite: 4]

> The demo data and your explanation will help us assess your data thinking skills, your understanding of the assignment, and how well your data represents realistic manufacturing workflows.[cite: 4]

---

## Deliverables[cite: 4]

### GitHub Repository[cite: 4]
A public GitHub repository containing:[cite: 4]
* Complete Frontend Source Code[cite: 4]
* Complete Backend Source Code[cite: 4]
* Database Schema[cite: 4]
* API Documentation[cite: 4]
* `README.md` with setup instructions[cite: 4]

### Project Walkthrough Video[cite: 4]
Record a 3–7 minute demonstration covering:[cite: 4]
* User Authentication[cite: 4]
* Role-Based Access Control[cite: 4]
* Order Creation[cite: 4]
* Inventory Validation[cite: 4]
* Production Planning[cite: 4]
* Manufacturing Workflow[cite: 4]
* Quality Inspection[cite: 4]
* Dispatch Process[cite: 4]
* Dashboard Overview[cite: 4]
* Database Structure[cite: 4]
* Backend APIs[cite: 4]

*You may use Loom, OBS Studio, or any preferred screen recording software.*[cite: 4]