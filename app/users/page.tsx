
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Users, LayoutDashboard, Bot, Package, ShoppingCart, Warehouse,
  Factory, ClipboardCheck, Truck, Settings, Plus, Search, X,
  Trash2, Power, RefreshCw, AlertCircle, Loader2, UserPlus,
  ShieldCheck, FileSpreadsheet, FileDown, FileUp, Download,
  Trash, UserRoundPlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type Employee = {
  id: number;
  employee_code: string;
  employee_name: string;
  department: string;
  designation: string;
  active: boolean;
};

type EmployeeForm = {
  employee_code: string;
  employee_name: string;
  department: string;
  designation: string;
};

type BulkRow = {
  employee_code: string;
  employee_name: string;
  department: string;
  designation: string;
};

const initialForm: EmployeeForm = {
  employee_code: "",
  employee_name: "",
  department: "Production",
  designation: "Staff",
};

const emptyBulkRow: BulkRow = {
  employee_code: "",
  employee_name: "",
  department: "Production",
  designation: "Staff",
};

const departments = [
  "Production", "Stores", "Quality", "Maintenance", "Purchase",
  "Dispatch", "HR", "Accounts", "Administration",
];

const designations = [
  "Staff", "Executive", "Senior Executive", "Supervisor",
  "Manager", "Assistant Manager", "Store In-charge", "Operator",
  "Helper",
];

const modules = [
  "Dashboard", "AI Assistant", "User Management", "Raw Materials",
  "Packing Materials", "Purchase", "Inventory", "Production",
  "Quality", "Maintenance", "Attendance", "Dispatch",
];

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "AI Assistant", icon: Bot, path: "/" },
  { name: "User Management", icon: Users, path: "/users" },
  { name: "Raw Materials", icon: Package, path: "/" },
  { name: "Packing Materials", icon: Package, path: "/" },
  { name: "Purchase", icon: ShoppingCart, path: "/" },
  { name: "Inventory", icon: Warehouse, path: "/" },
  { name: "Production", icon: Factory, path: "/" },
  { name: "Quality", icon: ClipboardCheck, path: "/" },
  { name: "Dispatch", icon: Truck, path: "/" },
  { name: "Settings", icon: Settings, path: "/" },
];

export default function UsersPage() {
  const router = useRouter();
  const supabase = createClient();
  const excelInputRef = useRef<HTMLInputElement>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbError, setDbError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [form, setForm] = useState<EmployeeForm>(initialForm);
  const [selectedModules, setSelectedModules] = useState<string[]>(["Dashboard"]);

  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    { ...emptyBulkRow },
    { ...emptyBulkRow },
    { ...emptyBulkRow },
  ]);

  const [bulkFileName, setBulkFileName] = useState("");

  useEffect(() => {
    void loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadEmployees() {
    setLoading(true);
    setDbError("");

    const { data, error } = await supabase
      .from("employees")
      .select("id, employee_code, employee_name, department, designation, active")
      .order("id", { ascending: false });

    if (error) {
      setDbError(error.message);
      setEmployees([]);
    } else {
      setEmployees((data ?? []) as Employee[]);
    }

    setLoading(false);
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        employee.employee_name.toLowerCase().includes(search) ||
        employee.employee_code.toLowerCase().includes(search) ||
        employee.department.toLowerCase().includes(search) ||
        employee.designation.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && employee.active) ||
        (statusFilter === "Inactive" && !employee.active);

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);

  const activeCount = employees.filter((e) => e.active).length;
  const inactiveCount = employees.length - activeCount;
  const activePercentage = employees.length
    ? Math.round((activeCount / employees.length) * 100)
    : 0;

  function showSuccess(message: string) {
    setDbError("");
    setSuccessMessage(message);
  }

  async function addEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.employee_code.trim() ||
      !form.employee_name.trim() ||
      !form.department.trim() ||
      !form.designation.trim()
    ) {
      setDbError("Please fill in all employee details.");
      return;
    }

    const duplicate = employees.some(
      (e) => e.employee_code.toLowerCase() === form.employee_code.trim().toLowerCase()
    );

    if (duplicate) {
      setDbError("This employee code already exists.");
      return;
    }

    setSaving(true);
    setDbError("");
    setSuccessMessage("");

    const { error } = await supabase.from("employees").insert({
      employee_code: form.employee_code.trim(),
      employee_name: form.employee_name.trim(),
      department: form.department.trim(),
      designation: form.designation.trim(),
      active: true,
    });

    if (error) {
      setDbError(error.message);
      setSaving(false);
      return;
    }

    setForm(initialForm);
    setSelectedModules(["Dashboard"]);
    setShowModal(false);
    showSuccess("Employee added successfully.");
    await loadEmployees();
    setSaving(false);
  }

  async function toggleEmployeeStatus(employee: Employee) {
    setDbError("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("employees")
      .update({ active: !employee.active })
      .eq("id", employee.id);

    if (error) {
      setDbError(error.message);
      return;
    }

    showSuccess(`${employee.employee_name} status updated successfully.`);
    await loadEmployees();
  }

  async function deleteEmployee(employee: Employee) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.employee_name}?`
    );

    if (!confirmed) return;

    setDbError("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", employee.id);

    if (error) {
      setDbError(error.message);
      return;
    }

    showSuccess("Employee deleted successfully.");
    await loadEmployees();
  }

  function toggleModule(module: string) {
    setSelectedModules((current) =>
      current.includes(module)
        ? current.filter((item) => item !== module)
        : [...current, module]
    );
  }

  function closeModal() {
    setShowModal(false);
    setForm(initialForm);
    setDbError("");
    setSelectedModules(["Dashboard"]);
  }

  function updateBulkRow(index: number, field: keyof BulkRow, value: string) {
    setBulkRows((current) =>
      current.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  }

  function addBulkRow() {
    setBulkRows((current) => [...current, { ...emptyBulkRow }]);
  }

  function removeBulkRow(index: number) {
    setBulkRows((current) => current.filter((_, i) => i !== index));
  }

  function resetBulkModal() {
    setBulkRows([
      { ...emptyBulkRow },
      { ...emptyBulkRow },
      { ...emptyBulkRow },
    ]);
    setBulkFileName("");
    setShowBulkModal(false);
    setDbError("");
  }

  function downloadExcelTemplate() {
    const template = [
      {
        employee_code: "DFPL001",
        employee_name: "Sample Employee",
        department: "Production",
        designation: "Operator",
      },
      {
        employee_code: "DFPL002",
        employee_name: "Sample Employee 2",
        department: "Stores",
        designation: "Executive",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, "Employee_Import_Template.xlsx");
  }

  function exportExcel() {
    if (filteredEmployees.length === 0) {
      setDbError("There are no employee records to export.");
      return;
    }

    const rows = filteredEmployees.map((employee) => ({
      "Employee Code": employee.employee_code,
      "Employee Name": employee.employee_name,
      Department: employee.department,
      Designation: employee.designation,
      Status: employee.active ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 28 },
      { wch: 20 },
      { wch: 24 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    XLSX.writeFile(
      workbook,
      `Employee_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    showSuccess("Excel report downloaded successfully.");
  }

  function exportPDF() {
    if (filteredEmployees.length === 0) {
      setDbError("There are no employee records to export.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(18);
    doc.text("MY AI ASSISTANT - MANUFACTURING ERP", 14, 17);

    doc.setFontSize(13);
    doc.text("Employee Management Report", 14, 26);

    doc.setFontSize(9);
    doc.text(
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      14,
      33
    );
    doc.text(`Total records: ${filteredEmployees.length}`, 14, 39);

    autoTable(doc, {
      startY: 45,
      head: [[
        "Employee Code",
        "Employee Name",
        "Department",
        "Designation",
        "Status",
      ]],
      body: filteredEmployees.map((employee) => [
        employee.employee_code,
        employee.employee_name,
        employee.department,
        employee.designation,
        employee.active ? "Active" : "Inactive",
      ]),
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [16, 27, 53],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 248, 252],
      },
    });

    doc.save(
      `Employee_Report_${new Date().toISOString().slice(0, 10)}.pdf`
    );

    showSuccess("PDF report downloaded successfully.");
  }

  async function importExcelFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setDbError("");
    setSuccessMessage("");
    setBulkFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!firstSheet) {
        throw new Error("The Excel file does not contain a worksheet.");
      }

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        firstSheet,
        { defval: "" }
      );

      if (rawRows.length === 0) {
        throw new Error("The Excel sheet is empty.");
      }

      const normalizedRows: BulkRow[] = rawRows.map((row) => {
        const normalized: Record<string, unknown> = {};

        Object.entries(row).forEach(([key, value]) => {
          normalized[key.trim().toLowerCase().replace(/[\s_-]+/g, "")] = value;
        });

        return {
          employee_code: String(
            normalized.employeecode ?? normalized.code ?? ""
          ).trim(),
          employee_name: String(
            normalized.employeename ?? normalized.name ?? ""
          ).trim(),
          department: String(normalized.department ?? "Production").trim(),
          designation: String(normalized.designation ?? "Staff").trim(),
        };
      });

      setBulkRows(normalizedRows);
      setShowBulkModal(true);
      showSuccess(`${normalizedRows.length} rows loaded. Review before saving.`);
    } catch (error) {
      setDbError(
        error instanceof Error ? error.message : "Unable to read Excel file."
      );
    } finally {
      event.target.value = "";
    }
  }

  async function saveBulkEmployees() {
    const rows = bulkRows
      .map((row) => ({
        employee_code: row.employee_code.trim(),
        employee_name: row.employee_name.trim(),
        department: row.department.trim(),
        designation: row.designation.trim(),
      }))
      .filter(
        (row) =>
          row.employee_code ||
          row.employee_name ||
          row.department ||
          row.designation
      );

    if (rows.length === 0) {
      setDbError("Please enter or import at least one employee.");
      return;
    }

    const incomplete = rows.filter(
      (row) =>
        !row.employee_code ||
        !row.employee_name ||
        !row.department ||
        !row.designation
    );

    if (incomplete.length > 0) {
      setDbError(
        `${incomplete.length} row(s) have missing details. Complete or remove them before saving.`
      );
      return;
    }

    const seenCodes = new Set<string>();
    const duplicateInFile: string[] = [];

    for (const row of rows) {
      const code = row.employee_code.toLowerCase();
      if (seenCodes.has(code)) duplicateInFile.push(row.employee_code);
      seenCodes.add(code);
    }

    if (duplicateInFile.length > 0) {
      setDbError(
        `Duplicate employee codes in this entry: ${duplicateInFile.join(", ")}`
      );
      return;
    }

    const existingCodes = new Set(
      employees.map((employee) => employee.employee_code.toLowerCase())
    );

    const duplicates = rows
      .filter((row) => existingCodes.has(row.employee_code.toLowerCase()))
      .map((row) => row.employee_code);

    if (duplicates.length > 0) {
      setDbError(
        `These employee codes already exist: ${duplicates.join(", ")}`
      );
      return;
    }

    setSaving(true);
    setDbError("");
    setSuccessMessage("");

    const insertRows = rows.map((row) => ({
      ...row,
      active: true,
    }));

    const { error } = await supabase.from("employees").insert(insertRows);

    if (error) {
      setDbError(error.message);
      setSaving(false);
      return;
    }

    setShowBulkModal(false);
    setBulkRows([{ ...emptyBulkRow }, { ...emptyBulkRow }, { ...emptyBulkRow }]);
    setBulkFileName("");
    showSuccess(`${rows.length} employees added successfully.`);
    await loadEmployees();
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 flex-col bg-[#101b35] text-white lg:flex">
          <div className="border-b border-white/10 px-6 py-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-xl font-bold">
                AI
              </div>
              <div>
                <h1 className="text-lg font-bold">My AI Assistant</h1>
                <p className="text-xs text-slate-400">Manufacturing ERP</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-5">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Main Menu
            </p>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const selected = item.name === "User Management";

                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                      selected
                        ? "bg-blue-600 font-semibold text-white shadow-lg shadow-blue-950/30"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 font-bold text-blue-300">
                PG
              </div>
              <div>
                <p className="text-sm font-semibold">Pranav Gour</p>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 shadow-sm md:px-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                User Management
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Manage employees and their account status
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">Pranav Gour</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                PG
              </div>
            </div>
          </header>

          <div className="space-y-4 p-3 md:p-5">
            
{/* COMPACT PAGE INTRO AND ACTIONS */}
<div className="flex flex-col justify-between gap-2 xl:flex-row xl:items-center">
  <div>
    <h3 className="text-xl font-bold text-slate-800">
      Employee Overview
    </h3>
    <p className="mt-1 text-xs text-slate-500">
      Manage employee records and access information.
    </p>
  </div>

  <div className="flex flex-wrap items-center gap-1.5">
    <button
      onClick={() => void loadEmployees()}
      disabled={loading}
      title="Refresh employees"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
      Refresh
    </button>

    <button
      onClick={exportPDF}
      disabled={loading || filteredEmployees.length === 0}
      title="Export PDF"
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
    >
      <FileDown size={14} />
      PDF
    </button>

    <button
      onClick={exportExcel}
      disabled={loading || filteredEmployees.length === 0}
      title="Export Excel"
      className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-2.5 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
    >
      <FileSpreadsheet size={14} />
      Excel
    </button>

    <button
      onClick={() => excelInputRef.current?.click()}
      title="Import Excel"
      className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100"
    >
      <FileUp size={14} />
      Import
    </button>

    <button
      onClick={() => {
        setDbError("");
        setSuccessMessage("");
        setShowBulkModal(true);
      }}
      title="Multiple employee entry"
      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
    >
      <UserRoundPlus size={14} />
      Bulk
    </button>

    <button
      onClick={() => {
        setDbError("");
        setSuccessMessage("");
        setShowModal(true);
      }}
      title="Add one employee"
      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
    >
      <Plus size={14} />
      Add
    </button>
  </div>
</div>

            {/* MESSAGES */}
            {dbError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={19} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Attention</p>
                  <p className="mt-1 break-words">{dbError}</p>
                </div>
                <button onClick={() => setDbError("")} className="ml-auto">
                  <X size={17} />
                </button>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <span>{successMessage}</span>
                <button onClick={() => setSuccessMessage("")}>
                  <X size={17} />
                </button>
              </div>
            )}

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="user-card animate-fade-up rounded-xl bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Employees</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-800">
                      {employees.length}
                    </h3>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Users size={23} />
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-400">Registered employee records</p>
              </div>

              <div className="user-card animate-fade-up rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Active Employees</p>
                    <h3 className="mt-2 text-3xl font-bold text-green-600">
                      {activeCount}
                    </h3>
                  </div>
                  <div className="rounded-xl bg-green-50 p-3 text-green-600">
                    <ShieldCheck size={23} />
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="animate-progress h-full rounded-full bg-green-500"
                    style={{ width: `${activePercentage}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {activePercentage}% of registered employees
                </p>
              </div>

              <div className="user-card animate-fade-up rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Inactive Employees</p>
                    <h3 className="mt-2 text-3xl font-bold text-orange-500">
                      {inactiveCount}
                    </h3>
                  </div>
                  <div className="rounded-xl bg-orange-50 p-3 text-orange-500">
                    <Power size={23} />
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-400">Currently inactive</p>
              </div>

              <div className="user-card animate-fade-up rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Departments</p>
                    <h3 className="mt-2 text-3xl font-bold text-purple-600">
                      {new Set(employees.map((e) => e.department)).size}
                    </h3>
                  </div>
                  <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                    <Factory size={23} />
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-400">Departments represented</p>
              </div>
            </div>

            {/* EMPLOYEE DIRECTORY */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center">
                <div>
                  <h3 className="font-bold text-slate-800">Employee Directory</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Supabase employee records · Export follows current search and filter
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search employees..."
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 size={30} className="animate-spin text-blue-600" />
                  <p className="text-sm">Loading employees...</p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
                  <div className="rounded-full bg-slate-100 p-4 text-slate-400">
                    <Users size={28} />
                  </div>
                  <h4 className="mt-4 font-semibold text-slate-700">No employees found</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Add an employee or change your search criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Employee</th>
                        <th className="px-5 py-4 font-semibold">Employee Code</th>
                        <th className="px-5 py-4 font-semibold">Department</th>
                        <th className="px-5 py-4 font-semibold">Designation</th>
                        <th className="px-5 py-4 font-semibold">Status</th>
                        <th className="px-5 py-4 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEmployees.map((employee) => (
                        <tr key={employee.id} className="transition hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                {employee.employee_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-800">
                                {employee.employee_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-medium text-slate-600">
                            {employee.employee_code}
                          </td>
                          <td className="px-5 py-4 text-slate-600">{employee.department}</td>
                          <td className="px-5 py-4 text-slate-600">{employee.designation}</td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                employee.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {employee.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => void toggleEmployeeStatus(employee)}
                                title={employee.active ? "Deactivate employee" : "Activate employee"}
                                className={`rounded-lg p-2 ${
                                  employee.active
                                    ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                                    : "bg-green-50 text-green-600 hover:bg-green-100"
                                }`}
                              >
                                <Power size={17} />
                              </button>
                              <button
                                onClick={() => void deleteEmployee(employee)}
                                title="Delete employee"
                                className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
                Showing {filteredEmployees.length} of {employees.length} employees
              </div>
            </section>

            {/* ACCESS INFORMATION */}
            <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck size={22} className="mt-0.5 shrink-0 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-800">Employee access management</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Employee records are connected to Supabase. Module-level access
                    permissions are not yet saved to the database and must be implemented
                    separately before they can control employee access.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* SINGLE EMPLOYEE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-2xl animate-fade-up overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Add New Employee</h3>
                  <p className="text-xs text-slate-500">Enter employee details below</p>
                </div>
              </div>
              <button onClick={closeModal} disabled={saving} aria-label="Close modal">
                <X size={21} />
              </button>
            </div>

            <form onSubmit={addEmployee} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Employee Code *</label>
                  <input
                    required
                    value={form.employee_code}
                    onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                    placeholder="e.g. DFPL001"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">Employee Name *</label>
                  <input
                    required
                    value={form.employee_name}
                    onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">Department *</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    {departments.map((department) => (
                      <option key={department}>{department}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">Designation *</label>
                  <select
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    {designations.map((designation) => (
                      <option key={designation}>{designation}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <h4 className="mb-1 text-sm font-semibold">ERP Modules</h4>
                <p className="mb-3 text-xs text-slate-500">
                  Preview only — module permissions are not saved yet.
                </p>
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                  {modules.map((module) => (
                    <label key={module} className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={selectedModules.includes(module)}
                        onChange={() => toggleModule(module)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      {module}
                    </label>
                  ))}
                </div>
              </div>

              {dbError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{dbError}</p>}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
                  {saving ? "Saving..." : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK ENTRY / EXCEL IMPORT MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm md:p-6">
          <div className="my-auto w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <UserRoundPlus size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Multiple Employee Entry</h3>
                  <p className="text-xs text-slate-500">
                    Add multiple employees or import an Excel worksheet
                  </p>
                </div>
              </div>
              <button
                onClick={resetBulkModal}
                disabled={saving}
                className="self-end rounded-lg p-2 text-slate-400 hover:bg-slate-100 sm:self-auto"
                aria-label="Close bulk entry"
              >
                <X size={21} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={downloadExcelTemplate}
                  className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
                >
                  <Download size={16} />
                  Download Excel Template
                </button>
                <button
                  onClick={() => excelInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100"
                >
                  <FileUp size={16} />
                  Import Excel
                </button>
                <button
                  onClick={addBulkRow}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Add Row
                </button>
                {bulkFileName && (
                  <span className="text-xs text-slate-500">
                    Loaded: {bulkFileName}
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                Required Excel headings: <strong>employee_code, employee_name, department, designation</strong>.
                You can use the template above. Review the imported rows before saving.
              </div>

              <div className="max-h-[48vh] overflow-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-600">
                    <tr>
                      <th className="w-12 px-3 py-3">#</th>
                      <th className="px-3 py-3">Employee Code *</th>
                      <th className="px-3 py-3">Employee Name *</th>
                      <th className="px-3 py-3">Department *</th>
                      <th className="px-3 py-3">Designation *</th>
                      <th className="w-16 px-3 py-3">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkRows.map((row, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                        <td className="px-2 py-2">
                          <input
                            value={row.employee_code}
                            onChange={(e) => updateBulkRow(index, "employee_code", e.target.value)}
                            placeholder="DFPL001"
                            className="w-full min-w-28 rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.employee_name}
                            onChange={(e) => updateBulkRow(index, "employee_name", e.target.value)}
                            placeholder="Employee name"
                            className="w-full min-w-40 rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={row.department}
                            onChange={(e) => updateBulkRow(index, "department", e.target.value)}
                            className="w-full min-w-32 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                          >
                            {departments.map((department) => (
                              <option key={department}>{department}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={row.designation}
                            onChange={(e) => updateBulkRow(index, "designation", e.target.value)}
                            className="w-full min-w-36 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                          >
                            {designations.map((designation) => (
                              <option key={designation}>{designation}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeBulkRow(index)}
                            disabled={saving}
                            title="Remove row"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {bulkRows.length} rows displayed · Blank rows are ignored.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={resetBulkModal}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void saveBulkEmployees()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={17} className="animate-spin" /> : <Users size={17} />}
                    {saving ? "Saving Employees..." : "Validate & Save Employees"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
