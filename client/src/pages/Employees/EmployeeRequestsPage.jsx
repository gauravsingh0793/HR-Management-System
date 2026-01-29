import { useCallback, useEffect, useMemo, useState } from "react";
import { apiService } from "@/redux/apis/APIService";
import { EmployeeRequestsEndPoints, EmployeeProfileEndPoints, NotificationEndPoints } from "@/redux/apis/APIsEndpoints";
import DataTable from "@/components/common/DataTable.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { useToast } from "@/hooks/use-toast.js";
import { FileText, Loader2 } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CelebrationAnimation } from "@/components/common/CelebrationAnimation.jsx";

export const EmployeeRequestsPage = () => {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [errorRequests, setErrorRequests] = useState("");
  const [newRequest, setNewRequest] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const requestColumns = useMemo(
    () => [
      { key: "title", label: "Title" },
      { key: "content", label: "Content" },
      { key: "department", label: "Department" },
      { key: "status", label: "Status" },
    ],
    []
  );

  const requestRows = useMemo(
    () =>
      (requests || []).map((r) => ({
        title: r.requesttitle || "-",
        content: r.requestconent || "-",
        department:
          typeof r.department === "object"
            ? r.department?.name
            : r.department || r.departmentname || "-",
        status: r.status || "Pending",
        statusColor: r.status === "Approved" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                     r.status === "Denied" ? "bg-red-100 text-red-700 border-red-200" : 
                     "bg-yellow-100 text-yellow-700 border-yellow-200",
      })),
    [requests]
  );

  const loadProfile = useCallback(async () => {
    try {
      const res = await apiService.get(EmployeeProfileEndPoints.GET, { withCredentials: true });
      const data = res.data?.data;
      if (data) {
        setMe(data);
      }
    } catch (error) {
      // Handle error silently
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    setErrorRequests("");
    try {
      const res = await apiService.get(EmployeeRequestsEndPoints.MY, { withCredentials: true });
      setRequests(res.data?.data || []);
    } catch (error) {
      setErrorRequests(error.response?.data?.message || error.message || "Unable to load requests");
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const openNewRequest = () => {
    setNewRequest({ requesttitle: "", requestconent: "" });
  };

  const submitNewRequest = async () => {
    if (!me?._id) {
      toast({ title: "Profile not loaded yet" });
      return;
    }
    try {
      await apiService.post(
        EmployeeRequestsEndPoints.CREATE,
        { ...newRequest, employeeID: me._id },
        { withCredentials: true }
      );
      toast({ title: "Request submitted", description: "Your request has been sent successfully." });
      setShowCelebration(true);
      setNewRequest(null);
      loadRequests();
    } catch (error) {
      toast({ title: "Could not submit request", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    loadProfile();
    loadRequests();
  }, [loadProfile, loadRequests]);

  // Mark requests as viewed when page loads
  useEffect(() => {
    apiService
      .post(NotificationEndPoints.EMPLOYEE_MARK_VIEWED, { section: "requests" }, { withCredentials: true })
      .catch(() => {
        // Silently handle error
      });
  }, []);

  return (
    <>
      <CelebrationAnimation 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)}
        message="Request Submitted!"
      />
      <div className="w-full mx-auto flex flex-col gap-6 animate-fade-in-up">
        {/* Header Card */}
        <Card className="frosted-card border-transparent shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/15 via-amber-400/15 to-yellow-500/15">
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">My Requests</CardTitle>
                  <CardDescription className="text-base mt-1">
                    View and manage your submitted requests
                  </CardDescription>
                </div>
              </div>
              {loadingRequests && (
                <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
              )}
            </div>
          </CardHeader>
        </Card>

        <DataTable
          title="Submitted Requests"
          description={`${requestRows.length} request${requestRows.length !== 1 ? 's' : ''} submitted`}
          data={requestRows}
          columns={requestColumns}
          loading={loadingRequests}
          error={errorRequests}
          cardClassName="m-0 w-full frosted-card border-transparent shadow-lg"
          onRefresh={loadRequests}
          onCreate={openNewRequest}
          createLabel="New Request"
        />

        {newRequest && (
          <Modal title="New Request" onClose={() => setNewRequest(null)}>
            <div className="grid grid-cols-1 gap-3">
              <LabeledInput
                label="Title"
                value={newRequest.requesttitle}
                onChange={(v) => setNewRequest((s) => ({ ...s, requesttitle: v }))}
              />
              <LabeledInput
                label="Content"
                value={newRequest.requestconent}
                onChange={(v) => setNewRequest((s) => ({ ...s, requestconent: v }))}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewRequest(null)}>
                Cancel
              </Button>
              <Button onClick={submitNewRequest}>Create</Button>
            </div>
          </Modal>
      )}
      </div>
    </>
  );
};

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 transition">
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
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

