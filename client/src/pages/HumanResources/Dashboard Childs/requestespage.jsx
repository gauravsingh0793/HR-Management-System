import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { apiService } from "@/redux/apis/APIService";
import { HRRequestEndPoints, NotificationEndPoints } from "@/redux/apis/APIsEndpoints";
import DataTable from "@/components/common/DataTable.jsx";
import { Button } from "@/components/ui/button.jsx";
import { CelebrationAnimation } from "@/components/common/CelebrationAnimation.jsx";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Label } from "@/components/ui/label";
import { HandleGetDashboard } from "@/redux/Thunks/DashboardThunk";

function formatShortDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hourStr = String(hours).padStart(2, "0");

  // Example: 23 Dec, 10:10 am
  return `${day} ${month}, ${hourStr}:${minutes} ${ampm}`;
}

export const HRRequestesPage = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    apiService
      .get(HRRequestEndPoints.GETALL)
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

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  // Mark requests as viewed when page loads
  useEffect(() => {
    apiService
      .post(NotificationEndPoints.HR_MARK_VIEWED, { section: "requests" }, { withCredentials: true })
      .catch(() => {
        // Silently handle error
      });
  }, []);

  // Transform data to add color coding based on status and format created date
  const transformedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => {
      const createdAtFormatted = formatShortDateTime(item.createdAt);

      return {
        ...item,
        // Override createdAt so the table never shows raw ISO
        createdAt: createdAtFormatted,
        // Add explicit field in case of custom columns
        createdDate: createdAtFormatted,
        statusColor:
          item.status === "Approved"
            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
            : item.status === "Denied"
            ? "bg-red-100 text-red-700 border-red-200"
            : "bg-slate-100 text-slate-700 border-slate-200",
      };
    });
  }, [data]);

  const openModal = (row, action) => {
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
    if (!modal.message?.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Message/reason is required",
      });
      return;
    }
    setModal((m) => ({ ...m, submitting: true }));
    try {
      const status = modal.action === "approve" ? "Approved" : "Denied";
      await apiService.patch(
        HRRequestEndPoints.UPDATE_STATUS,
        {
          requestID: modal.row._id,
          approvedby: modal.row.approvedby?._id,
          status,
          message: modal.message,
        },
        { withCredentials: true }
      );
      closeModal();
      setShowCelebration(true);
      toast({
        title: `Request ${modal.action === "approve" ? "approved" : "denied"}!`,
        description: `The request has been ${modal.action === "approve" ? "approved" : "denied"} successfully.`,
      });
      // Refresh dashboard to update pending request count
      dispatch(HandleGetDashboard({ apiroute: "GETDATA" }));
      load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: e?.response?.data?.message || e.message || "Failed to update employee request",
      });
      setModal((m) => ({ ...m, submitting: false }));
    }
  };

  return (
    <>
      <CelebrationAnimation 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)}
        message={modal?.action === "approve" ? "Request Approved!" : "Request Denied!"}
      />
      <div className="w-full mx-auto flex flex-col gap-6 animate-fade-in-up">
        {/* Header Card */}
        <Card className="frosted-card border-transparent shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/15 via-purple-400/15 to-pink-500/15">
                  <ClipboardList className="w-8 h-8 text-violet-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Request Management</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Review and manage employee-generated requests
                  </CardDescription>
                </div>
              </div>
              {loading && (
                <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              )}
            </div>
          </CardHeader>
        </Card>

        <DataTable
          title="Employee Requests"
          description={`${transformedData.length} request${transformedData.length !== 1 ? 's' : ''} in the system`}
          data={transformedData}
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
                Deny
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
                  ? "Approve Request"
                  : "Deny Request"}
              </DialogTitle>
              <DialogDescription>
                {modal?.action === "approve"
                  ? "Review and approve this employee request"
                  : "Provide a reason for denying this request"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">
                    Employee: {modal?.row.employee?.firstname || ""} {modal?.row.employee?.lastname || ""}
                  </p>
                  <p className="text-sm text-slate-600">
                    Title: {modal?.row.requesttitle || "-"}
                  </p>
                  {modal?.row.requestconent && (
                    <p className="text-sm text-slate-600">
                      Content: {modal.row.requestconent}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-base font-semibold">
                  Message / Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  rows={4}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  value={modal?.message || ""}
                  onChange={(e) =>
                    setModal((m) => ({ ...m, message: e.target.value }))
                  }
                  placeholder="Explain the reason for approval or denial..."
                  required
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
                disabled={modal?.submitting || !modal?.message?.trim()}
                variant={modal?.action === "approve" ? "default" : "destructive"}
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
