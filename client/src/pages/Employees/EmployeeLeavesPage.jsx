import { useCallback, useEffect, useState, useMemo } from "react";
import { apiService } from "@/redux/apis/APIService";
import {
  EmployeeLeavesEndPoints,
  EmployeeProfileEndPoints,
  NotificationEndPoints,
} from "@/redux/apis/APIsEndpoints";
import DataTable from "@/components/common/DataTable.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { useToast } from "@/hooks/use-toast.js";
import { CalendarDays, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CelebrationAnimation } from "@/components/common/CelebrationAnimation.jsx";

export const EmployeeLeavesPage = () => {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [errorLeaves, setErrorLeaves] = useState("");
  const [newLeave, setNewLeave] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await apiService.get(EmployeeProfileEndPoints.GET, {
        withCredentials: true,
      });
      const data = res.data?.data;
      if (data) {
        setMe(data);
      }
    } catch (error) {
      // Handle error silently
    }
  }, []);

  const loadLeaves = useCallback(async () => {
    setLoadingLeaves(true);
    setErrorLeaves("");
    try {
      const res = await apiService.get(EmployeeLeavesEndPoints.MY, {
        withCredentials: true,
      });
      setLeaves(res.data?.data || []);
    } catch (error) {
      setErrorLeaves(
        error.response?.data?.message ||
          error.message ||
          "Unable to load leaves"
      );
    } finally {
      setLoadingLeaves(false);
    }
  }, []);

  // Transform leaves data to include employee name, status, and formatted dates
  const transformedLeaves = useMemo(() => {
    if (!Array.isArray(leaves)) return [];
    const employeeName = me
      ? `${me.firstname || ""} ${me.lastname || ""}`.trim()
      : "-";

    return leaves.map((leave) => ({
      _id: leave._id,
      employeeName: employeeName,
      title: leave.title || "Leave Application",
      startDate: leave.startdate
        ? new Date(leave.startdate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "-",
      endDate: leave.enddate
        ? new Date(leave.enddate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "-",
      reason: leave.reason || "-",
      status: leave.status || "Pending",
      statusColor:
        leave.status === "Approved"
          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
          : leave.status === "Rejected"
          ? "bg-red-100 text-red-700 border-red-200"
          : "bg-slate-100 text-slate-700 border-slate-200",
      originalData: leave,
    }));
  }, [leaves, me]);

  const columns = useMemo(
    () => [
      { key: "employeeName", label: "Employee Name" },
      { key: "title", label: "Title" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "reason", label: "Reason" },
      { key: "status", label: "Status" },
    ],
    []
  );

  const openNewLeave = () => {
    setNewLeave({ title: "", reason: "", startdate: "", enddate: "" });
  };

  const submitNewLeave = async () => {
    if (!me?._id) {
      toast({ title: "Profile not loaded yet" });
      return;
    }
    try {
      await apiService.post(
        EmployeeLeavesEndPoints.CREATE,
        { ...newLeave, employeeID: me._id },
        { withCredentials: true }
      );
      toast({
        title: "Leave created",
        description: "Your leave request has been submitted successfully.",
      });
      setShowCelebration(true);
      setNewLeave(null);
      loadLeaves();
    } catch (error) {
      toast({
        title: "Could not create leave",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadProfile();
    loadLeaves();
  }, [loadProfile, loadLeaves]);

  // Mark leaves as viewed when page loads
  useEffect(() => {
    apiService
      .post(
        NotificationEndPoints.EMPLOYEE_MARK_VIEWED,
        { section: "leaves" },
        { withCredentials: true }
      )
      .catch(() => {
        // Silently handle error
      });
  }, []);

  return (
    <>
      <CelebrationAnimation
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
        message="Leave Request Submitted!"
      />
      <div className="w-full mx-auto flex flex-col gap-6 animate-fade-in-up">
        {/* Header Card */}
        <Card className="frosted-card border-transparent shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/15 via-blue-400/15 to-indigo-500/15">
                  <CalendarDays className="w-8 h-8 text-cyan-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    My Leaves
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Track and manage your leave requests
                  </CardDescription>
                </div>
              </div>
              {loadingLeaves && (
                <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
              )}
            </div>
          </CardHeader>
        </Card>

        <DataTable
          title="Leave Requests"
          description={`${transformedLeaves.length} leave request${
            transformedLeaves.length !== 1 ? "s" : ""
          } submitted`}
          data={transformedLeaves}
          columns={columns}
          loading={loadingLeaves}
          error={errorLeaves}
          cardClassName="m-0 w-full frosted-card border-transparent shadow-lg"
          onRefresh={loadLeaves}
          onCreate={openNewLeave}
          createLabel="Request Leave"
        />
        {newLeave && (
          <Modal title="New Leave" onClose={() => setNewLeave(null)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LabeledInput
                label="Title"
                value={newLeave.title}
                onChange={(v) => setNewLeave((s) => ({ ...s, title: v }))}
              />
              <LabeledInput
                label="Reason"
                value={newLeave.reason}
                onChange={(v) => setNewLeave((s) => ({ ...s, reason: v }))}
              />
              <LabeledInput
                label="Start date"
                type="date"
                value={newLeave.startdate}
                onChange={(v) => setNewLeave((s) => ({ ...s, startdate: v }))}
              />
              <LabeledInput
                label="End date"
                type="date"
                value={newLeave.enddate}
                onChange={(v) => setNewLeave((s) => ({ ...s, enddate: v }))}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewLeave(null)}>
                Cancel
              </Button>
              <Button onClick={submitNewLeave}>Create</Button>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
};

function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-lg w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
