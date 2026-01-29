import { useEffect, useState, useCallback } from "react";
import { apiService } from "@/redux/apis/APIService";
import { HRRecruitmentEndPoints } from "@/redux/apis/APIsEndpoints";
import DataTable from "@/components/common/DataTable.jsx";
import { Button } from "@/components/ui/button.jsx";
import { CelebrationAnimation } from "@/components/common/CelebrationAnimation.jsx";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Loader2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea.jsx";

export function HRRecruitmentPage() {
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
      .get(HRRecruitmentEndPoints.GETALL)
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

  const openCreate = () => {
    setModal({
      mode: "create",
      jobtitle: "",
      description: "",
      submitting: false,
    });
  };

  const openEdit = (row) => {
    setModal({
      mode: "edit",
      row,
      jobtitle: row.jobtitle || "",
      description: row.description || "",
      submitting: false,
    });
  };

  const closeModal = () => {
    if (modal?.submitting) return;
    setModal(null);
  };

  const submit = async () => {
    if (!modal) return;
    if (!modal.jobtitle.trim() || !modal.description.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Job title and description are required",
      });
      return;
    }
    try {
      setModal((m) => ({ ...m, submitting: true }));
      if (modal.mode === "create") {
        await apiService.post(
          HRRecruitmentEndPoints.CREATE,
          {
            jobtitle: modal.jobtitle,
            description: modal.description,
          },
          { withCredentials: true }
        );
        setShowCelebration(true);
        toast({
          title: "Recruitment created!",
          description: "The recruitment position has been added successfully.",
        });
      } else {
        await apiService.patch(
          HRRecruitmentEndPoints.UPDATE,
          {
            recruitmentID: modal.row._id,
            jobtitle: modal.jobtitle,
            description: modal.description,
            departmentID: modal.row.department || modal.row.departmentID,
          },
          { withCredentials: true }
        );
        setShowCelebration(true);
        toast({
          title: "Recruitment updated!",
          description: "The recruitment position has been updated successfully.",
        });
      }
      setModal(null);
      load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: e?.response?.data?.message || e.message || "Failed to save recruitment record",
      });
      setModal((m) => ({ ...m, submitting: false }));
    }
  };

  return (
    <>
      <CelebrationAnimation 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)}
        message={modal?.mode === "create" ? "Position Created!" : "Position Updated!"}
      />
      <div className="w-full mx-auto flex flex-col gap-6 animate-fade-in-up">
        {/* Header Card */}
        <Card className="frosted-card border-transparent shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/15 via-blue-400/15 to-indigo-500/15">
                  <Briefcase className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Recruitment Management</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Manage open positions and recruitment entries
                  </CardDescription>
                </div>
              </div>
              {loading && (
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              )}
            </div>
          </CardHeader>
        </Card>

        <DataTable
          title="Recruitment"
          description={`${data.length} recruitment position${data.length !== 1 ? 's' : ''} available`}
          data={data}
          loading={loading}
          error={error}
          onRefresh={load}
          onCreate={openCreate}
          createLabel="Add Position"
          cardClassName="m-0 w-full frosted-card border-transparent shadow-lg"
          renderActions={(row) => (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => openEdit(row)}
              className="hover-lift"
            >
              Edit
            </Button>
          )}
        />

        {/* Modern Dialog */}
        <Dialog open={!!modal} onOpenChange={closeModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {modal?.mode === "create"
                  ? "Create Recruitment Position"
                  : "Edit Recruitment Position"}
              </DialogTitle>
              <DialogDescription>
                {modal?.mode === "create"
                  ? "Add a new job opening to your recruitment pipeline"
                  : "Update the details of this recruitment position"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="jobtitle" className="text-base font-semibold">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="jobtitle"
                  placeholder="e.g., Senior Software Engineer"
                  value={modal?.jobtitle || ""}
                  onChange={(e) =>
                    setModal((m) => ({ ...m, jobtitle: e.target.value }))
                  }
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the position, requirements, and responsibilities..."
                  rows={6}
                  value={modal?.description || ""}
                  onChange={(e) =>
                    setModal((m) => ({ ...m, description: e.target.value }))
                  }
                  className="resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
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
                onClick={submit} 
                disabled={modal?.submitting || !modal?.jobtitle?.trim() || !modal?.description?.trim()}
                className="hover-lift"
              >
                {modal?.submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
