import { useEffect, useState, useCallback, useMemo } from "react";
import { apiService } from "@/redux/apis/APIService";
import {
  EmployeesIDsEndPoints,
  HRDepartmentPageEndPoints,
  HRNoticeEndPoints,
  HRProfilesEndPoints,
  NotificationEndPoints,
} from "@/redux/apis/APIsEndpoints";
import DataTable from "@/components/common/DataTable.jsx";
import { Button } from "@/components/ui/button.jsx";
import { CelebrationAnimation } from "@/components/common/CelebrationAnimation.jsx";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea.jsx";

export function HRNoticesPage() {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [audience, setAudience] = useState("Department-Specific");
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [hrId, setHrId] = useState("");
  const [form, setForm] = useState({
    title: "",
    content: "",
    departmentID: "",
    employeeID: "",
  });

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    apiService
      .get(HRNoticeEndPoints.GETALL)
      .then((res) => {
        if (!active) return;
        // controller returns { department_notices, employee_notices }
        const d = res.data?.data;
        const rows = Array.isArray(d)
          ? d
          : [
              ...(d?.department_notices || []),
              ...(d?.employee_notices || []),
            ];
        setData(rows);
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

  // Fetch current HR id (best effort) to satisfy backend requirement
  useEffect(() => {
    let active = true;
    apiService
      .get(HRProfilesEndPoints.GETALL, { withCredentials: true })
      .then((res) => {
        if (!active) return;
        const rows = Array.isArray(res.data?.data) ? res.data.data : res.data;
        const first = Array.isArray(rows) && rows.length ? rows[0] : null;
        setHrId(first?._id || "");
      })
      .catch(() => {
        if (!active) return;
        setHrId("");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  // Mark notices as viewed when page loads
  useEffect(() => {
    apiService
      .post(NotificationEndPoints.HR_MARK_VIEWED, { section: "notices" }, { withCredentials: true })
      .catch(() => {
        // Silently handle error
      });
  }, []);

  // Transform data to show department/employee names in audience column
  const transformedData = useMemo(() => {
    return data.map(notice => {
      let audienceDisplay = notice.audience;
      
      if (notice.audience === "Department-Specific" && notice.department) {
        audienceDisplay = notice.department.name || "Department";
      } else if (notice.audience === "Employee-Specific" && notice.employee) {
        audienceDisplay = `${notice.employee.firstname || ""} ${notice.employee.lastname || ""}`.trim() || "Employee";
      }

      // Format createdAt date
      let formattedDate = notice.createdAt;
      if (notice.createdAt) {
        const date = new Date(notice.createdAt);
        const options = { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true };
        formattedDate = date.toLocaleDateString('en-US', options).replace(',', '');
      }

      return {
        ...notice,
        audience: audienceDisplay,
        organizationID: notice.organizationID && /^[0-9a-fA-F]{24}$/.test(notice.organizationID)
          ? "HR Nexus"
          : notice.organizationID || "HR Nexus",
        createdAt: formattedDate
      };
    });
  }, [data]);

  const openModal = async () => {
    setForm({
      title: "",
      content: "",
      departmentID: "",
      employeeID: "",
    });
    setAudience("Department-Specific");
    try {
      const [depRes, empRes] = await Promise.all([
        apiService.get(HRDepartmentPageEndPoints.GETALL, {
          withCredentials: true,
        }),
        apiService.get(EmployeesIDsEndPoints.GETALL, { withCredentials: true }),
      ]);
      const depRows = Array.isArray(depRes.data?.data)
        ? depRes.data.data
        : depRes.data;
      const empRows = Array.isArray(empRes.data?.data)
        ? empRes.data.data
        : empRes.data;
      setDepartments(Array.isArray(depRows) ? depRows : []);
      setEmployees(Array.isArray(empRows) ? empRows : []);
    } catch {
      setDepartments([]);
      setEmployees([]);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const submitNotice = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title and content are required",
      });
      return;
    }
    if (audience === "Department-Specific" && !form.departmentID) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a department",
      });
      return;
    }
    if (audience === "Employee-Specific" && !form.employeeID) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select an employee",
      });
      return;
    }
    if (!hrId) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Unable to identify HR. Please re-login and try again.",
      });
      return;
    }
    try {
      setSaving(true);
      await apiService.post(
        HRNoticeEndPoints.CREATE,
        {
          title: form.title,
          content: form.content,
          audience,
          departmentID:
            audience === "Department-Specific" ? form.departmentID : undefined,
          employeeID:
            audience === "Employee-Specific" ? form.employeeID : undefined,
          HRID: hrId,
        },
        { withCredentials: true }
      );
      setModalOpen(false);
      setShowCelebration(true);
      toast({
        title: "Notice published!",
        description: "The notice has been published successfully.",
      });
      load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to publish",
        description: e?.response?.data?.message || e.message || "Failed to create notice",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CelebrationAnimation 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)}
        message="Notice Published!"
      />
      <div className="w-full mx-auto flex flex-col gap-6 animate-fade-in-up">
        {/* Header Card */}
        <Card className="frosted-card border-transparent shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/15 via-red-400/15 to-pink-500/15">
                  <Megaphone className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Notice Management</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Create and manage company-wide or targeted notices
                  </CardDescription>
                </div>
              </div>
              {loading && (
                <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
              )}
            </div>
          </CardHeader>
        </Card>

        <DataTable
          title="Issue Notices"
          description={`${data.length} notice${data.length !== 1 ? 's' : ''} published`}
          data={transformedData}
          loading={loading}
          error={error}
          cardClassName="m-0 w-full frosted-card border-transparent shadow-lg"
          onRefresh={load}
          onCreate={openModal}
          createLabel="Publish Notice"
        />

        {/* Modern Dialog */}
        <Dialog open={modalOpen} onOpenChange={closeModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Publish New Notice</DialogTitle>
              <DialogDescription>
                Create a notice for departments or specific employees
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4 py-4" onSubmit={submitNotice}>
              <div className="space-y-2">
                <Label htmlFor="audience" className="text-base font-semibold">
                  Target Audience <span className="text-red-500">*</span>
                </Label>
                <select
                  id="audience"
                  className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                >
                  <option value="Department-Specific">Department Specific</option>
                  <option value="Employee-Specific">Employee Specific</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Notice title"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target" className="text-base font-semibold">
                    {audience === "Department-Specific" ? "Department" : "Employee"} <span className="text-red-500">*</span>
                  </Label>
                  {audience === "Department-Specific" ? (
                    <select
                      id="target"
                      name="departmentID"
                      className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      value={form.departmentID}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name || d.departmentname || d._id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      id="target"
                      name="employeeID"
                      className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      value={form.employeeID}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select employee</option>
                      {employees.map((e) => (
                        <option key={e._id} value={e._id}>
                          {`${e.firstname || ""} ${e.lastname || ""}`.trim()}
                          {e.department?.name ? ` (${e.department.name})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-base font-semibold">
                  Content <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={6}
                  value={form.content}
                  onChange={handleChange}
                  placeholder="Write the notice content here..."
                  required
                  className="resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={saving}
                  className="hover-lift"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving || !form.title?.trim() || !form.content?.trim()}
                  className="hover-lift"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Notice"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
