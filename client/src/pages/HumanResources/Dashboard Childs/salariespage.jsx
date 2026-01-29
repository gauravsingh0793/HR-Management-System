import { useEffect, useState, useCallback, useMemo } from "react";
import { apiService } from "@/redux/apis/APIService";
import { EmployeesIDsEndPoints, HRSalaryEndPoints } from "@/redux/apis/APIsEndpoints";
import DataTable from "@/components/common/DataTable.jsx";
import { Button } from "@/components/ui/button.jsx";
import { CelebrationAnimation } from "@/components/common/CelebrationAnimation.jsx";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Loader2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function HRSalariesPage() {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [form, setForm] = useState({
    employeeID: "",
    basicpay: "",
    bonusePT: "",
    deductionPT: "",
    duedate: "",
    currency: "USD",
    status: "Pending",
  });

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    apiService
      .get(HRSalaryEndPoints.GETALL)
      .then((res) => {
        if (!active) return;
        const rows = Array.isArray(res.data?.data) ? res.data.data : res.data;
        const mapped = Array.isArray(rows)
          ? rows.map((r) => ({
              ...r,
              employee_name: r?.employee
                ? `${r.employee.firstname || ""} ${
                    r.employee.lastname || ""
                  }`.trim()
                : "Not Specified",
              createdby_name: r?.createdby
                ? `${r.createdby.firstname || ""} ${
                    r.createdby.lastname || ""
                  }`.trim()
                : "Not Specified",
              salary_month: r?.duedate
                ? new Date(r.duedate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })
                : "Not Specified",
              due_date: r?.duedate
                ? new Date(r.duedate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : "Not Specified",
              statusColor: r?.status === "Paid" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                           r?.status === "Delayed" ? "bg-orange-100 text-orange-700 border-orange-200" : 
                           "bg-red-100 text-red-700 border-red-200",
            }))
          : [];
        setData(mapped);
      })
      .catch((e) => {
        if (!active) return;
        setError(e?.response?.data?.message || e.message || "Failed to load");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await apiService.get(EmployeesIDsEndPoints.GETALL, {
        withCredentials: true,
      });
      const rows = Array.isArray(res.data?.data) ? res.data.data : res.data;
      setEmployees(Array.isArray(rows) ? rows : []);
    } catch {
      setEmployees([]);
    }
  }, []);

  const openCreate = async () => {
    await loadEmployees();
    setForm({
      employeeID: "",
      basicpay: "",
      bonusePT: "",
      deductionPT: "",
      duedate: "",
      currency: "USD",
      status: "Pending",
    });
    setCreating(true);
    setEditing(null);
  };

  const openEdit = async (row) => {
    await loadEmployees();
    setForm({
      employeeID: row.employee?._id || row.employee,
      basicpay: row.basicpay ?? "",
      bonusePT: row.bonuses ? ((row.bonuses / (row.basicpay || 1)) * 100).toFixed(2) : "",
      deductionPT: row.deductions
        ? ((row.deductions / (row.basicpay || 1)) * 100).toFixed(2)
        : "",
      duedate: row.duedate ? new Date(row.duedate).toISOString().slice(0, 10) : "",
      currency: row.currency || "USD",
      status: row.status || "Pending",
    });
    setEditing(row);
    setCreating(false);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        employeeID: form.employeeID,
        basicpay: Number(form.basicpay),
        bonusePT: Number(form.bonusePT) || 0,
        deductionPT: Number(form.deductionPT) || 0,
        duedate: form.duedate,
        currency: form.currency,
        status: form.status,
      };

      if (!payload.employeeID || !payload.basicpay || !payload.duedate || !payload.currency) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Employee, basic pay, due date and currency are required",
        });
        return;
      }

      if (editing) {
        await apiService.patch(
          HRSalaryEndPoints.UPDATE,
          { salaryID: editing._id, ...payload },
          { withCredentials: true }
        );
        setShowCelebration(true);
        toast({
          title: "Salary updated!",
          description: "The salary record has been updated successfully.",
        });
      } else {
        await apiService.post(HRSalaryEndPoints.CREATE, payload, {
          withCredentials: true,
        });
        setShowCelebration(true);
        toast({
          title: "Salary created!",
          description: "The salary record has been created successfully.",
        });
      }

      closeModal();
      load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: e?.response?.data?.message || e.message || "Failed to save salary",
      });
    }
  };

  // Calculate net pay for display
  const calculateNetPay = () => {
    const basic = Number(form.basicpay) || 0;
    const bonusPct = Number(form.bonusePT) || 0;
    const deductionPct = Number(form.deductionPT) || 0;
    const bonus = (basic * bonusPct) / 100;
    const deduction = (basic * deductionPct) / 100;
    return basic + bonus - deduction;
  };

  const columns = useMemo(
    () => [
      { key: "employee_name", label: "Employee Name" },
      { key: "salary_month", label: "Salary Month" },
      { key: "basicpay", label: "Basic Pay" },
      { key: "netpay", label: "Net Pay" },
      { key: "currency", label: "Currency" },
      { key: "due_date", label: "Due Date" },
      { key: "status", label: "Status" },
    ],
    []
  );

  return (
    <>
      <CelebrationAnimation 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)}
        message={editing ? "Salary Updated!" : "Salary Created!"}
      />
      <div className="w-full mx-auto flex flex-col gap-6 animate-fade-in-up">
        {/* Header Card */}
        <Card className="frosted-card border-transparent shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/15 via-blue-400/15 to-indigo-500/15">
                  <Wallet className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Salary Management</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Manage employee salaries and payroll records
                  </CardDescription>
                </div>
              </div>
              {loading && (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              )}
            </div>
          </CardHeader>
        </Card>

        <DataTable
          title="Salaries"
          description={`${data.length} salary record${data.length !== 1 ? 's' : ''} in the system`}
          data={data}
          columns={columns}
          loading={loading}
          error={error}
          onRefresh={load}
          onCreate={openCreate}
          createLabel="Add Salary"
          cardClassName="m-0 w-full frosted-card border-transparent shadow-lg"
          renderActions={(row) => (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEdit(row)}
              className="hover-lift"
            >
              Edit
            </Button>
          )}
        />

        {/* Modern Dialog */}
        <Dialog open={creating || !!editing} onOpenChange={closeModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editing ? "Edit Salary Record" : "Create Salary Record"}
              </DialogTitle>
              <DialogDescription>
                {editing 
                  ? "Update the salary details for this employee"
                  : "Add a new salary record for an employee"}
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4 py-4" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="employeeID" className="text-base font-semibold">
                    Employee <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="employeeID"
                    name="employeeID"
                    value={form.employeeID}
                    onChange={handleChange}
                    className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                    disabled={!!editing}
                  >
                    <option value="">Select employee</option>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {`${e.firstname || ""} ${e.lastname || ""}`.trim()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="basicpay" className="text-base font-semibold">
                    Basic Pay <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="basicpay"
                    name="basicpay"
                    type="number"
                    value={form.basicpay}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-base font-semibold">
                    Currency <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="currency"
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    required
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bonusePT" className="text-base font-semibold">
                    Bonus (%)
                  </Label>
                  <Input
                    id="bonusePT"
                    name="bonusePT"
                    type="number"
                    value={form.bonusePT}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.01"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deductionPT" className="text-base font-semibold">
                    Deduction (%)
                  </Label>
                  <Input
                    id="deductionPT"
                    name="deductionPT"
                    type="number"
                    value={form.deductionPT}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.01"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duedate" className="text-base font-semibold">
                    Due Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duedate"
                    name="duedate"
                    type="date"
                    value={form.duedate}
                    onChange={handleChange}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-base font-semibold">
                    Status
                  </Label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                {/* Net Pay Preview */}
                {(form.basicpay || form.bonusePT || form.deductionPT) && (
                  <div className="sm:col-span-2 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Estimated Net Pay:</span>
                      <span className="text-xl font-bold text-emerald-700">
                        {form.currency} {calculateNetPay().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="hover-lift"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="hover-lift"
                >
                  {editing ? "Save Changes" : "Create Salary"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
