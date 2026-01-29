import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { apiService } from "@/redux/apis/APIService";
import {
  HRLeavesEndPoints,
  HRProfilesEndPoints,
  NotificationEndPoints,
} from "@/redux/apis/APIsEndpoints";
import DataTable from "@/components/common/DataTable.jsx";
import { Button } from "@/components/ui/button.jsx";
import { CelebrationAnimation } from "@/components/common/CelebrationAnimation.jsx";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Label } from "@/components/ui/label";
import { HandleGetDashboard } from "@/redux/Thunks/DashboardThunk";

export const HRLeavesPage = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [hrId, setHrId] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    apiService
      .get(HRLeavesEndPoints.GETALL)
      .then((res) => {
        if (!active) return;
        setData(Array.isArray(res.data?.data) ? res.data.data : res.data);
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

  // Best-effort grab current HR id for approvals
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

  // Mark leaves as viewed when page loads
  useEffect(() => {
    apiService
      .post(
        NotificationEndPoints.HR_MARK_VIEWED,
        { section: "leaves" },
        { withCredentials: true }
      )
      .catch(() => {
        // Silently handle error
      });
  }, []);

  // Transform data to show employee name, department, and formatted dates
  const transformedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      _id: item._id,
      employeeName: item.employee
        ? `${item.employee.firstname || ""} ${
            item.employee.lastname || ""
          }`.trim()
        : "-",
      department:
        item.employee?.department?.name ||
        (typeof item.employee?.department === "string"
          ? "Loading..."
          : "Not specified"),
      startDate: item.startdate
        ? new Date(item.startdate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "-",
      endDate: item.enddate
        ? new Date(item.enddate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "-",
      reason: item.reason || "-",
      status: item.status || "Pending",
      statusColor:
        item.status === "Approved"
          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
          : item.status === "Rejected"
          ? "bg-red-100 text-red-700 border-red-200"
          : "bg-slate-100 text-slate-700 border-slate-200",
      title: item.title || "Leave Application",
      // Keep original data for modal
      originalData: item,
    }));
  }, [data]);

  const columns = useMemo(
    () => [
      { key: "employeeName", label: "Employee Name" },
      { key: "department", label: "Department" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "reason", label: "Reason" },
      { key: "status", label: "Status" },
    ],
    []
  );

  const openModal = (row, action) => {
    // Use originalData if available, otherwise use row
    const originalRow = row.originalData || row;
    setModal({
      row,
      action,
      message: "",
      submitting: false,
    });
  };

  const closeModal = () => setModal(null);

  const submitDecision = async () => {
    if (!modal?.row) return;
    if (!hrId) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description:
          "Unable to approve without HR ID. Please re-login and try again.",
      });
      return;
    }
    setModal((m) => ({ ...m, submitting: true }));
    try {
      const action = modal.action;
      const status = action === "approve" ? "Approved" : "Rejected";
      const leaveId = modal.row.originalData?._id || modal.row._id;
      await apiService.patch(
        HRLeavesEndPoints.UPDATE_STATUS,
        {
          leaveID: leaveId,
          status,
          HRID: hrId,
        },
        { withCredentials: true }
      );
      closeModal();
      const message =
        action === "approve" ? "Leave Approved!" : "Leave Rejected!";
      setCelebrationMessage(message);
      setShowCelebration(true);
      toast({
        title: `Leave request ${
          action === "approve" ? "approved" : "rejected"
        }!`,
        description: `The leave request has been ${
          action === "approve" ? "approved" : "rejected"
        } successfully.`,
      });
      // Refresh dashboard to update pending leave count
      dispatch(HandleGetDashboard({ apiroute: "GETDATA" }));
      load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description:
          e?.response?.data?.message ||
          e.message ||
          "Failed to update leave request",
      });
      setModal((m) => ({ ...m, submitting: false }));
    }
  };

  return (
    <>
      <CelebrationAnimation
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
        message={celebrationMessage}
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
                    Leave Management
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Review and manage employee leave requests
                  </CardDescription>
                </div>
              </div>
              {loading && (
                <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
              )}
            </div>
          </CardHeader>
        </Card>

        <DataTable
          title="Leave Requests"
          description={`${transformedData.length} leave request${
            transformedData.length !== 1 ? "s" : ""
          } in the system`}
          data={transformedData}
          columns={columns}
          loading={loading}
          error={error}
          onRefresh={load}
          cardClassName="m-0 w-full frosted-card border-transparent shadow-lg"
          renderActions={(row) => (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={row.status !== "Pending"}
                onClick={() => openModal(row, "approve")}
                className="hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={row.status !== "Pending"}
                onClick={() => openModal(row, "reject")}
                className="hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject
              </Button>
            </div>
          )}
        />

        {/* Modern Dialog */}
        <Dialog open={!!modal} onOpenChange={closeModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {modal?.action === "approve"
                  ? "Approve Leave Request"
                  : "Reject Leave Request"}
              </DialogTitle>
              <DialogDescription>
                {modal?.action === "approve"
                  ? "Confirm approval of this leave request"
                  : "Provide a reason for rejecting this leave request"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">
                    Employee:{" "}
                    {modal?.row?.originalData?.employee?.firstname ||
                      modal?.row?.employee?.firstname ||
                      ""}{" "}
                    {modal?.row?.originalData?.employee?.lastname ||
                      modal?.row?.employee?.lastname ||
                      ""}
                  </p>
                  <p className="text-sm text-slate-600">
                    Department:{" "}
                    {modal?.row?.originalData?.employee?.department?.name ||
                      modal?.row?.originalData?.employee?.department ||
                      modal?.row?.employee?.department?.name ||
                      "Not specified"}
                  </p>
                  <p className="text-sm text-slate-600">
                    Dates:{" "}
                    {modal?.row?.originalData?.startdate
                      ? new Date(
                          modal.row.originalData.startdate
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : modal?.row?.startdate
                      ? new Date(modal.row.startdate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "-"}{" "}
                    -{" "}
                    {modal?.row?.originalData?.enddate
                      ? new Date(
                          modal.row.originalData.enddate
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : modal?.row?.enddate
                      ? new Date(modal.row.enddate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "-"}
                  </p>
                  {(modal?.row?.originalData?.reason || modal?.row?.reason) && (
                    <p className="text-sm text-slate-600">
                      Reason:{" "}
                      {modal.row.originalData?.reason || modal.row.reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-base font-semibold">
                  Message / Reason{" "}
                  {modal?.action === "reject" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <Textarea
                  id="message"
                  rows={4}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  value={modal?.message || ""}
                  onChange={(e) =>
                    setModal((m) => ({ ...m, message: e.target.value }))
                  }
                  placeholder={
                    modal?.action === "approve"
                      ? "Optional message for the employee..."
                      : "Please provide a reason for rejection..."
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                type="button"
                onClick={closeModal}
                disabled={modal?.submitting}
                className="hover-lift"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitDecision}
                disabled={
                  modal?.submitting ||
                  (modal?.action === "reject" && !modal?.message?.trim())
                }
                variant={
                  modal?.action === "approve" ? "default" : "destructive"
                }
                className="hover-lift"
              >
                {modal?.submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
