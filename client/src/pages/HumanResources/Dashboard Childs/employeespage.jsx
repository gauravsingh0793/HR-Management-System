import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "@/components/common/DataTable.jsx";
import { HandleGetHREmployees } from "@/redux/Thunks/HREmployeesThunk.js";
import {
  AddEmployeesDialogBox,
  DeleteEmployeeDialogBox,
  EmployeeDetailsDialogBox,
} from "@/components/common/Dashboard/dialogboxes.jsx";
import { CelebrationAnimation } from "@/components/common/CelebrationAnimation.jsx";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2, UserCheck, UserX } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export const HREmployeesPage = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const HREmployeesState = useSelector((state) => state.HREmployeesPageReducer);
  const [addOpen, setAddOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastOperation, setLastOperation] = useState(null);
  const [celebrationMessage, setCelebrationMessage] =
    useState("Employee Added!");

  useEffect(() => {
    dispatch(HandleGetHREmployees({ apiroute: "GETALL" }));
  }, [dispatch]);

  useEffect(() => {
    if (HREmployeesState.fetchData) {
      dispatch(HandleGetHREmployees({ apiroute: "GETALL" }));
    }
  }, [HREmployeesState.fetchData, dispatch]);

  // Auto-refresh employee data every 30 seconds to keep attendance status updated
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(HandleGetHREmployees({ apiroute: "GETALL" }));
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  // Show celebration on successful employee creation or deletion
  useEffect(() => {
    if (
      HREmployeesState.success &&
      HREmployeesState.fetchData &&
      lastOperation
    ) {
      if (lastOperation === "remove") {
        setCelebrationMessage("Employee Removed!");
        toast({
          title: "Employee removed successfully!",
          description: "The employee has been removed from the system.",
        });
      } else if (lastOperation === "add") {
        setCelebrationMessage("Employee Added!");
        toast({
          title: "Employee added successfully!",
          description: "The employee has been created and added to the system.",
        });
      }
      setShowCelebration(true);
      setLastOperation(null);
    }
  }, [
    HREmployeesState.success,
    HREmployeesState.fetchData,
    toast,
    lastOperation,
  ]);

  const rows = useMemo(() => {
    const list = Array.isArray(HREmployeesState.data)
      ? HREmployeesState.data
      : [];

    return list.map((item) => {
      // Determine if employee is active based on today's check-in
      const now = new Date();
      let isActive = false;

      // Check if employee has checked in today
      if (item.checkInTime) {
        const checkInDate = new Date(item.checkInTime);

        // Validate the date
        if (!isNaN(checkInDate.getTime())) {
          const hoursSinceCheckIn = (now - checkInDate) / (1000 * 60 * 60); // Convert to hours

          // Check if there's a valid checkout time
          const hasCheckedOut =
            item.checkOutTime && !isNaN(new Date(item.checkOutTime).getTime());

          // Employee is active only if:
          // 1. They have checked in
          // 2. They have NOT checked out (or checkOutTime is null/invalid)
          // 3. Check-in was less than 12 hours ago
          if (!hasCheckedOut && hoursSinceCheckIn < 12) {
            isActive = true;
          }
        }
      }

      // Format check-in/out times
      const formatTime = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      };

      return {
        _id: item._id,
        name: `${item.firstname || ""} ${item.lastname || ""}`.trim() || "-",
        email: item.email || "-",
        department:
          item.departmentID?.name || item.department?.name || "Not specified",
        contact: item.mobilenumber || item.contactnumber || "-",
        activeStatus: isActive ? "Active" : "Inactive",
        checkInTime: formatTime(item.checkInTime),
        checkOutTime: formatTime(item.checkOutTime),
        monthlyPerformance:
          typeof item.monthlyPerformance === "number"
            ? item.monthlyPerformance.toFixed(2)
            : "N/A",
        activeStatusColor: isActive
          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
          : "bg-red-100 text-red-700 border-red-200",
      };
    });
  }, [HREmployeesState.data]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = rows.length;
    const activeToday = rows.filter((r) => r.activeStatus === "Active").length;
    const inactiveToday = total - activeToday;

    return {
      total,
      activeToday,
      inactiveToday,
    };
  }, [rows]);

  const columns = useMemo(
    () => [
      { key: "name", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "department", label: "Department" },
      { key: "contact", label: "Contact Number" },
      { key: "activeStatus", label: "Status" },
      { key: "checkInTime", label: "Check-In" },
      { key: "checkOutTime", label: "Check-Out" },
      { key: "monthlyPerformance", label: "Monthly Performance" },
    ],
    [],
  );

  const errorMessage = HREmployeesState.error?.status
    ? HREmployeesState.error?.message
    : "";

  return (
    <>
      <CelebrationAnimation
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
        message={celebrationMessage}
      />
      <div className="employee-page-content w-full mx-auto flex flex-col gap-6 animate-fade-in-up">
        {/* Header Card */}
        <Card className="frosted-card border-transparent shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/15 via-emerald-400/15 to-indigo-500/15">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    Employee Management
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Manage your organization&apos;s employees and their
                    information
                  </CardDescription>
                </div>
              </div>
              {HREmployeesState.isLoading && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="frosted-card border-transparent shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm">
                  Total Employees
                </CardDescription>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {statistics.total}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                In your organization
              </p>
            </CardContent>
          </Card>

          <Card className="frosted-card border-transparent shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm">
                  Checked In Today
                </CardDescription>
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">
                {statistics.activeToday}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {statistics.total > 0
                  ? `${Math.round((statistics.activeToday / statistics.total) * 100)}% of total`
                  : "No employees"}
              </p>
            </CardContent>
          </Card>

          <Card className="frosted-card border-transparent shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm">
                  Not Checked In
                </CardDescription>
                <UserX className="w-5 h-5 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-600">
                {statistics.inactiveToday}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {statistics.total > 0
                  ? `${Math.round((statistics.inactiveToday / statistics.total) * 100)}% of total`
                  : "No employees"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <DataTable
          title="Employees"
          description={`${rows.length} employee${
            rows.length !== 1 ? "s" : ""
          } in your organization`}
          data={rows}
          columns={columns}
          loading={HREmployeesState.isLoading}
          error={errorMessage}
          cardClassName="m-0 w-full frosted-card border-transparent shadow-lg"
          onRefresh={() =>
            dispatch(HandleGetHREmployees({ apiroute: "GETALL" }))
          }
          onCreate={() => setAddOpen(true)}
          createLabel="Add Employee"
          renderActions={(row) => (
            <div className="flex gap-2">
              <EmployeeDetailsDialogBox EmployeeID={row._id} />
              <DeleteEmployeeDialogBox
                EmployeeID={row._id}
                onDelete={() => setLastOperation("remove")}
              />
            </div>
          )}
        />
        <AddEmployeesDialogBox
          open={addOpen}
          onOpenChange={setAddOpen}
          onAdd={() => setLastOperation("add")}
          hideTrigger
        />
      </div>
    </>
  );
};
