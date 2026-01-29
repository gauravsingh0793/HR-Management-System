import { useEffect, useState, useCallback, useMemo } from "react";
import { apiService } from "@/redux/apis/APIService";
import {
  EmployeesIDsEndPoints,
  HRInterviewEndPoints,
} from "@/redux/apis/APIsEndpoints";
import DataTable from "@/components/common/DataTable.jsx";
import { Button } from "@/components/ui/button.jsx";
import { CelebrationAnimation } from "@/components/common/CelebrationAnimation.jsx";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Loader2, FileDown, Filter } from "lucide-react";
import * as XLSX from "xlsx";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea.jsx";

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

export function HRInterviewInsightsPage() {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, completed

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    apiService
      .get(HRInterviewEndPoints.GETALL)
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

  // Calculate statistics
  const statistics = useMemo(() => {
    const pending = data.filter(
      (i) => (i.status || "").toLowerCase() === "pending",
    ).length;
    const completed = data.filter(
      (i) => (i.status || "").toLowerCase() === "completed",
    ).length;
    const cancelled = data.filter((i) => {
      const s = (i.status || "").toLowerCase();
      return s === "canceled" || s === "cancelled";
    }).length;
    return { pending, completed, cancelled, total: data.length };
  }, [data]);

  // Transform data with status colors and organization name
  const transformedData = useMemo(() => {
    let filtered = data.map((interview) => {
      const statusLower = (interview.status || "").toLowerCase();
      let statusColor = "";

      if (statusLower === "pending") {
        statusColor = "bg-yellow-100 text-yellow-700 border-yellow-300";
      } else if (statusLower === "completed") {
        statusColor = "bg-green-100 text-green-700 border-green-300";
      } else if (statusLower === "canceled" || statusLower === "cancelled") {
        statusColor = "bg-red-100 text-red-700 border-red-300";
      }
      // Prefer the explicitly scheduled interview date; if missing,
      // fall back to when the record was actually created so the
      // column always shows a real date & time.
      const interviewDateSource =
        interview.interviewdate || interview.createdAt || null;
      const interviewDateFormatted = formatShortDateTime(interviewDateSource);
      const responseDateFormatted = formatShortDateTime(interview.responsedate);

      return {
        ...interview,
        statusColor,
        // Override raw ISO fields so the table never shows 2025-12-25T...
        interviewdate: interviewDateFormatted,
        responsedate: responseDateFormatted,
        // Also expose nicely-named fields if used in custom columns
        interviewDate: interviewDateFormatted,
        responseDate: responseDateFormatted,
        organizationID:
          interview.organizationID &&
          /^[0-9a-fA-F]{24}$/.test(interview.organizationID)
            ? "HR Nexus"
            : interview.organizationID || "HR Nexus",
      };
    });

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const status = (item.status || "").toLowerCase();
        return status === statusFilter.toLowerCase();
      });
    }

    // Sort: pending interviews first, then by date
    filtered.sort((a, b) => {
      const aStatus = (a.status || "").toLowerCase();
      const bStatus = (b.status || "").toLowerCase();

      // Pending interviews first
      if (aStatus === "pending" && bStatus !== "pending") return -1;
      if (aStatus !== "pending" && bStatus === "pending") return 1;

      // Within same status, sort by date (most recent first)
      const aDate = new Date(a.interviewdate || a.createdAt || 0);
      const bDate = new Date(b.interviewdate || b.createdAt || 0);
      return bDate - aDate;
    });

    return filtered;
  }, [data, statusFilter]);

  const loadLookups = useCallback(async () => {
    try {
      const [appRes, empRes] = await Promise.all([
        apiService.get("/api/v1/applicant/all", { withCredentials: true }),
        apiService.get(EmployeesIDsEndPoints.GETALL, { withCredentials: true }),
      ]);
      const appRows = Array.isArray(appRes.data?.data)
        ? appRes.data.data
        : appRes.data;
      const empRows = Array.isArray(empRes.data?.data)
        ? empRes.data.data
        : empRes.data;
      setApplicants(Array.isArray(appRows) ? appRows : []);
      setEmployees(Array.isArray(empRows) ? empRows : []);
    } catch {
      setApplicants([]);
      setEmployees([]);
    }
  }, []);

  const openModal = (row) => {
    setModal({
      mode: "edit",
      row,
      status: row.status || "Pending",
      feedback: row.feedback || "",
      date: row.interviewdate
        ? new Date(row.interviewdate).toISOString().slice(0, 16)
        : "",
      submitting: false,
      applicantID: row.applicant?._id || "",
      interviewerID: row.interviewer?._id || "",
    });
  };

  const openCreate = async () => {
    await loadLookups();
    setModal({
      mode: "create",
      row: null,
      status: "Pending",
      feedback: "",
      date: "",
      submitting: false,
      applicantName: "",
      applicantEmail: "",
      interviewerID: "",
      bulkMode: false,
      bulkApplicants: [{ name: "", email: "" }],
    });
  };

  const closeModal = () => setModal(null);

  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = transformedData.map((item) => ({
        "Applicant Name": item.applicant?.name || "-",
        "Applicant Email": item.applicant?.email || "-",
        Interviewer: item.interviewer?.firstname
          ? `${item.interviewer.firstname} ${item.interviewer.lastname || ""}`.trim()
          : "-",
        Status: item.status || "-",
        "Interview Date": item.interviewdate || "-",
        "Response Date": item.responsedate || "-",
        Feedback: item.feedback || "-",
        Organization: item.organizationID || "HR Nexus",
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws["!cols"] = [
        { wch: 20 }, // Applicant Name
        { wch: 25 }, // Applicant Email
        { wch: 20 }, // Interviewer
        { wch: 12 }, // Status
        { wch: 18 }, // Interview Date
        { wch: 18 }, // Response Date
        { wch: 40 }, // Feedback
        { wch: 15 }, // Organization
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Interview Insights");

      // Generate filename with current date
      const date = new Date().toISOString().split("T")[0];
      const filename = `Interview_Insights_${date}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Export Successful",
        description: `Downloaded ${transformedData.length} interview records`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const submitUpdate = async () => {
    if (!modal?.row) return;
    setModal((m) => ({ ...m, submitting: true }));
    try {
      const UpdatedData = {
        status: modal.status,
        feedback: modal.feedback,
      };
      if (modal.date) {
        UpdatedData.interviewdate = new Date(modal.date);
      }
      await apiService.patch(
        HRInterviewEndPoints.UPDATE,
        {
          interviewID: modal.row._id,
          UpdatedData,
        },
        { withCredentials: true },
      );
      closeModal();
      setShowCelebration(true);
      toast({
        title: "Interview updated!",
        description: "The interview record has been updated successfully.",
      });
      load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description:
          e?.response?.data?.message ||
          e.message ||
          "Failed to update interview record",
      });
      setModal((m) => ({ ...m, submitting: false }));
    }
  };

  const submitCreate = async () => {
    // Shared validation for interviewer and date
    if (!modal?.interviewerID) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select an interviewer",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Bulk scheduling mode
    if (modal?.bulkMode) {
      const rows = Array.isArray(modal.bulkApplicants)
        ? modal.bulkApplicants
        : [];

      const validRows = rows.filter((r) => r.name?.trim() && r.email?.trim());

      if (validRows.length === 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Add at least one applicant with name and email",
        });
        return;
      }

      for (const r of validRows) {
        if (!emailRegex.test(r.email.trim())) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: `Invalid email: ${r.email}`,
          });
          return;
        }
      }

      const interviews = validRows.map((r) => ({
        applicantName: r.name.trim(),
        applicantEmail: r.email.trim(),
        interviewerID: modal.interviewerID,
        interviewDate: modal.date || undefined,
      }));

      setModal((m) => ({ ...m, submitting: true }));
      try {
        const res = await apiService.post(
          HRInterviewEndPoints.BULK_CREATE,
          { interviews },
          { withCredentials: true },
        );

        closeModal();
        setShowCelebration(true);
        const createdCount = res.data?.created?.length || 0;
        const failedCount = res.data?.failed?.length || 0;
        toast({
          title: "Bulk interviews scheduled!",
          description: `${createdCount} created, ${failedCount} failed`,
        });
        load();
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Failed to schedule",
          description:
            e?.response?.data?.message ||
            e.message ||
            "Failed to schedule bulk interviews",
        });
        setModal((m) => ({ ...m, submitting: false }));
      }
      return;
    }

    // Single applicant mode
    if (!modal?.applicantName || !modal?.applicantEmail) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Applicant name and email are required",
      });
      return;
    }

    if (!emailRegex.test(modal.applicantEmail)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid email address",
      });
      return;
    }

    setModal((m) => ({ ...m, submitting: true }));
    try {
      await apiService.post(
        HRInterviewEndPoints.CREATE,
        {
          applicantName: modal.applicantName,
          applicantEmail: modal.applicantEmail,
          interviewerID: modal.interviewerID,
          interviewDate: modal.date || undefined,
        },
        { withCredentials: true },
      );
      closeModal();
      setShowCelebration(true);
      toast({
        title: "Interview scheduled!",
        description: "The interview has been scheduled successfully.",
      });
      load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to schedule",
        description:
          e?.response?.data?.message ||
          e.message ||
          "Failed to schedule interview",
      });
      setModal((m) => ({ ...m, submitting: false }));
    }
  };

  return (
    <>
      <CelebrationAnimation
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
        message={
          modal?.mode === "create"
            ? "Interview Scheduled!"
            : "Interview Updated!"
        }
      />
      <div className="w-full mx-auto flex flex-col gap-6 animate-fade-in-up">
        {/* Header Card */}
        <Card className="frosted-card border-transparent shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/15 via-orange-400/15 to-red-500/15">
                  <UserCheck className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    Interview Management
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Schedule and manage candidate interviews
                  </CardDescription>
                </div>
              </div>
              {loading && (
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="frosted-card border-transparent shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <span className="text-sm text-slate-600">Total Interviews</span>
                <span className="text-2xl font-bold text-slate-900">
                  {statistics.total}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="frosted-card border-yellow-200 bg-yellow-50/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <span className="text-sm text-yellow-700">Pending</span>
                <span className="text-2xl font-bold text-yellow-800">
                  {statistics.pending}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="frosted-card border-green-200 bg-green-50/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <span className="text-sm text-green-700">Completed</span>
                <span className="text-2xl font-bold text-green-800">
                  {statistics.completed}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="frosted-card border-red-200 bg-red-50/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <span className="text-sm text-red-700">Cancelled</span>
                <span className="text-2xl font-bold text-red-800">
                  {statistics.cancelled}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Export Controls */}
        <Card className="frosted-card border-transparent shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  Filter:
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                >
                  All ({statistics.total})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  onClick={() => setStatusFilter("pending")}
                  className={
                    statusFilter === "pending"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : ""
                  }
                >
                  Pending ({statistics.pending})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  onClick={() => setStatusFilter("completed")}
                  className={
                    statusFilter === "completed"
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                >
                  Completed ({statistics.completed})
                </Button>
              </div>
              <div className="ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportToExcel}
                  className="gap-2"
                  disabled={transformedData.length === 0}
                >
                  <FileDown className="w-4 h-4" />
                  Export to Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataTable
          title="Interview Insights"
          description={`${transformedData.length} interview${
            transformedData.length !== 1 ? "s" : ""
          } ${statusFilter !== "all" ? `(${statusFilter})` : ""}`}
          data={transformedData}
          loading={loading}
          error={error}
          onRefresh={load}
          onCreate={openCreate}
          createLabel="Schedule Interview"
          cardClassName="m-0 w-full frosted-card border-transparent shadow-lg"
          renderActions={(row) => (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openModal(row)}
              className="hover-lift"
            >
              Update
            </Button>
          )}
        />

        {/* Modern Dialog */}
        <Dialog open={!!modal} onOpenChange={closeModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {modal?.mode === "create"
                  ? "Schedule Interview"
                  : "Update Interview"}
              </DialogTitle>
              <DialogDescription>
                {modal?.mode === "create"
                  ? "Create a new interview schedule for a candidate"
                  : "Update interview details and feedback"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {modal?.mode === "create" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      id="bulkMode"
                      type="checkbox"
                      checked={modal.bulkMode}
                      onChange={(e) =>
                        setModal((m) => ({
                          ...m,
                          bulkMode: e.target.checked,
                        }))
                      }
                    />
                    <Label
                      htmlFor="bulkMode"
                      className="text-sm font-medium text-slate-700"
                    >
                      Schedule for multiple applicants
                    </Label>
                  </div>

                  {!modal.bulkMode ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="applicantName"
                          className="text-base font-semibold"
                        >
                          Applicant Name
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="applicantName"
                          type="text"
                          placeholder="Enter applicant full name"
                          value={modal.applicantName}
                          onChange={(e) =>
                            setModal((m) => ({
                              ...m,
                              applicantName: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="applicantEmail"
                          className="text-base font-semibold"
                        >
                          Applicant Email
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="applicantEmail"
                          type="email"
                          placeholder="applicant@example.com"
                          value={modal.applicantEmail}
                          onChange={(e) =>
                            setModal((m) => ({
                              ...m,
                              applicantEmail: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="interviewer"
                          className="text-base font-semibold"
                        >
                          Interviewer
                          <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="interviewer"
                          className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          value={modal.interviewerID}
                          onChange={(e) =>
                            setModal((m) => ({
                              ...m,
                              interviewerID: e.target.value,
                            }))
                          }
                          required
                        >
                          <option value="">Select HR interviewer</option>
                          {employees.map((e) => (
                            <option key={e._id} value={e._id}>
                              {`${e.firstname || ""} ${
                                e.lastname || ""
                              }`.trim()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-700">
                          Add multiple applicants. All will share the same
                          interviewer and date.
                        </p>
                      </div>
                      {modal.bulkApplicants.map((row, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto] gap-3 items-end"
                        >
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Name</Label>
                            <Input
                              type="text"
                              placeholder="Applicant name"
                              value={row.name}
                              onChange={(e) => {
                                const rows = [...modal.bulkApplicants];
                                rows[index] = {
                                  ...rows[index],
                                  name: e.target.value,
                                };
                                setModal((m) => ({
                                  ...m,
                                  bulkApplicants: rows,
                                }));
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Email</Label>
                            <Input
                              type="email"
                              placeholder="applicant@example.com"
                              value={row.email}
                              onChange={(e) => {
                                const rows = [...modal.bulkApplicants];
                                rows[index] = {
                                  ...rows[index],
                                  email: e.target.value,
                                };
                                setModal((m) => ({
                                  ...m,
                                  bulkApplicants: rows,
                                }));
                              }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const rows = modal.bulkApplicants.filter(
                                  (_r, i) => i !== index,
                                );
                                setModal((m) => ({
                                  ...m,
                                  bulkApplicants:
                                    rows.length > 0
                                      ? rows
                                      : [{ name: "", email: "" }],
                                }));
                              }}
                              disabled={modal.bulkApplicants.length === 1}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center gap-3 pt-1">
                        <div className="space-y-1">
                          <Label
                            htmlFor="interviewer-bulk"
                            className="text-base font-semibold"
                          >
                            Interviewer
                            <span className="text-red-500">*</span>
                          </Label>
                          <select
                            id="interviewer-bulk"
                            className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            value={modal.interviewerID}
                            onChange={(e) =>
                              setModal((m) => ({
                                ...m,
                                interviewerID: e.target.value,
                              }))
                            }
                            required
                          >
                            <option value="">Select HR interviewer</option>
                            {employees.map((e) => (
                              <option key={e._id} value={e._id}>
                                {`${e.firstname || ""} ${
                                  e.lastname || ""
                                }`.trim()}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setModal((m) => ({
                              ...m,
                              bulkApplicants: [
                                ...m.bulkApplicants,
                                { name: "", email: "" },
                              ],
                            }))
                          }
                        >
                          Add applicant
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-900">
                    Applicant: {modal?.row.applicant?.firstname || ""}{" "}
                    {modal?.row.applicant?.lastname || ""}
                  </p>
                  {modal?.row.applicant?.appliedrole && (
                    <p className="text-sm text-slate-600 mt-1">
                      Position: {modal.row.applicant.appliedrole}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-base font-semibold">
                    Status
                  </Label>
                  <select
                    id="status"
                    className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    value={modal?.status}
                    onChange={(e) =>
                      setModal((m) => ({ ...m, status: e.target.value }))
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-base font-semibold">
                    Interview Date & Time
                  </Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    className="h-11"
                    value={modal?.date}
                    onChange={(e) =>
                      setModal((m) => ({ ...m, date: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback" className="text-base font-semibold">
                  Feedback / Notes
                </Label>
                <Textarea
                  id="feedback"
                  rows={4}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  value={modal?.feedback || ""}
                  onChange={(e) =>
                    setModal((m) => ({ ...m, feedback: e.target.value }))
                  }
                  placeholder="Add feedback or notes about the interview..."
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
                onClick={modal?.mode === "create" ? submitCreate : submitUpdate}
                disabled={
                  modal?.submitting ||
                  (modal?.mode === "create" &&
                    !modal?.bulkMode &&
                    (!modal?.applicantName ||
                      !modal?.applicantEmail ||
                      !modal?.interviewerID))
                }
                className="hover-lift"
              >
                {modal?.submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {modal?.mode === "create" ? "Scheduling..." : "Saving..."}
                  </>
                ) : modal?.mode === "create" ? (
                  "Schedule Interview"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
