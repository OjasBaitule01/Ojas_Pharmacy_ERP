# Ojas Pharmacy ERP

Ojas Pharmacy ERP is a premium, full-stack pharmacy inventory, prescription, and billing (POS) management platform. It is built using **React.js (Vite)**, **Node.js (Express)**, and **MongoDB (Mongoose)**, styled with a custom, high-fidelity dark glassmorphic design system.

---

## Features

1. **Role-Based Authentication (RBAC)**: Supports Admin, Pharmacist, and Staff login states with tailored page access.
2. **Interactive Operations Dashboard**: Built-in metrics tracker displaying daily revenue, total orders, low-stock warnings, and expired medicine alerts, integrated with **Recharts** area graphs.
3. **POS Billing System**: Cashier terminal with live search, stock limit checks, automated 12% GST calculation, receipt printing formatting, and custom discounts.
4. **Inventory Desk**: Detailed medicine logging, categorical filters, low-stock indicators, and add/edit/delete operations.
5. **Prescription Control**: Upload scanned doctor prescriptions (JPEG/PNG/PDF), track patient history, and convert prescription items into POS billing carts with a single click.
6. **Reports & Analytics**: Complete sales ledger tracking invoices, operators, and payment methods, along with inventory asset valuation tables showing stock cost values.

---

## Technology Stack

* **Frontend**: React (Vite), Vanilla CSS (Custom Obsidian Glass Theme), Lucide Icons, Recharts.
* **Backend**: Node.js, Express, JWT, Bcrypt.js, Mongoose.
* **Database**: MongoDB.

---

## Getting Started

### Prerequisites

You need **Node.js** (v18 or higher) and **MongoDB** installed on your machine.

#### Setting up MongoDB:
1. **Local Install**: Download and run [MongoDB Community Server](https://www.mongodb.com/try/download/community). Ensure it is running on `localhost:27017`.
2. **Docker**: Alternatively, run MongoDB using Docker:
   ```bash
   docker run -d -p 27017:27017 --name ojas-mongo mongo:latest
   ```
3. **MongoDB Atlas (Cloud)**: You can also use a free cloud cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). Update the `MONGO_URI` in `backend/.env` with your Atlas connection string.

---

### Installation & Run

We have structured the application for easy setup. Open two terminals to run the services concurrently:

#### 1. Backend Server Setup
Navigate to the backend directory, install packages, and start the server:
```bash
cd backend
npm install
npm run dev
```
*The server will run on [http://localhost:5000](http://localhost:5000). On first run, it will automatically connect to MongoDB and seed demo users, medicines, prescriptions, and sales so the dashboard is immediately populated!*

#### 2. Frontend React Setup
Open a second terminal, navigate to the frontend directory, install packages, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
*The React app will open on [http://localhost:5173](http://localhost:5173).*

---


