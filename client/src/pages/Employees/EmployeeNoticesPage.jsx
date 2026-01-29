import { useCallback, useEffect, useState, useMemo } from "react";
import { apiService } from "@/redux/apis/APIService";
import { EmployeeNoticeEndPoints, NotificationEndPoints } from "@/redux/apis/APIsEndpoints";
import DataTable from "@/components/common/DataTable.jsx";
import { Megaphone, Loader2 } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const EmployeeNoticesPage = () => {
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [errorNotices, setErrorNotices] = useState("");

  const loadNotices = useCallback(async () => {
    setLoadingNotices(true);
    setErrorNotices("");
    try {
      const res = await apiService.get(EmployeeNoticeEndPoints.GETALL, { withCredentials: true });
      // Extract all notices from both arrays
      const data = res.data?.data;
      const allNotices = [
        ...(data?.department_notices || []),
        ...(data?.employee_notices || [])
      ];
      setNotices(allNotices);
    } catch (error) {
      setErrorNotices(error.response?.data?.message || error.message || "Unable to load notices");
    } finally {
      setLoadingNotices(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  // Mark notices as viewed when page loads
  useEffect(() => {
    apiService
      .post(NotificationEndPoints.EMPLOYEE_MARK_VIEWED, { section: "notices" }, { withCredentials: true })
      .catch(() => {
        // Silently handle error
      });
  }, []);

  // Transform data to show department/employee names
  const transformedNotices = useMemo(() => {
    return notices.map(notice => {
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
  }, [notices]);

  return (
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
                <CardTitle className="text-2xl font-bold text-slate-900">Company Notices</CardTitle>
                <CardDescription className="text-base mt-1">
                  View important notices and announcements
                </CardDescription>
              </div>
            </div>
            {loadingNotices && (
              <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
            )}
          </div>
        </CardHeader>
      </Card>

      <DataTable
        title="Notices"
        description={`${notices.length} notice${notices.length !== 1 ? 's' : ''} available`}
        data={transformedNotices}
        loading={loadingNotices}
        error={errorNotices}
        cardClassName="m-0 w-full frosted-card border-transparent shadow-lg"
        onRefresh={loadNotices}
      />
    </div>
  );
};

