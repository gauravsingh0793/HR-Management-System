import { HRDepartmentTabs } from "../../../components/common/Dashboard/departmentTabs";
import { useState } from "react";
import { CreateDepartmentDialogBox } from "../../../components/common/Dashboard/dialogboxes";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const HRDepartmentPage = () => {
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <div className="w-full mx-auto flex flex-col gap-6 animate-fade-in-up">
      {/* Header Card */}
      <Card className="frosted-card border-transparent shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/15 via-purple-400/15 to-pink-500/15">
              <Building2 className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">Department Management</CardTitle>
              <CardDescription className="text-base mt-1">
                Organize and manage your organization's departments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="department-container w-auto flex flex-col gap-4">
        <HRDepartmentTabs onCreateDepartment={() => setCreateOpen(true)} />
        <CreateDepartmentDialogBox open={createOpen} onOpenChange={setCreateOpen} hideTrigger />
      </div>
    </div>
  );
};
