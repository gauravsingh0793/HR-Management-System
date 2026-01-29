import { useCallback, useEffect, useState, useMemo } from "react";
import { apiService } from "@/redux/apis/APIService";
import { EmployeeSalaryEndPoints } from "@/redux/apis/APIsEndpoints";
import DataTable from "@/components/common/DataTable.jsx";
import { DollarSign, Loader2 } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const EmployeeSalariesPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [loadingSalaries, setLoadingSalaries] = useState(false);
  const [errorSalaries, setErrorSalaries] = useState("");

  const loadSalaries = useCallback(async () => {
    setLoadingSalaries(true);
    setErrorSalaries("");
    try {
      const res = await apiService.get(EmployeeSalaryEndPoints.MY, { withCredentials: true });
      setSalaries(res.data?.data || []);
    } catch (error) {
      setErrorSalaries(error.response?.data?.message || error.message || "Unable to load salaries");
    } finally {
      setLoadingSalaries(false);
    }
  }, []);

  useEffect(() => {
    loadSalaries();
  }, [loadSalaries]);

  const transformedSalaries = useMemo(() => {
    return (salaries || []).map((salary) => ({
      ...salary,
      employeeName: salary.employee
        ? `${salary.employee.firstname || ""} ${salary.employee.lastname || ""}`.trim()
        : "Not Specified",
      createdByName: salary.createdby
        ? `${salary.createdby.firstname || ""} ${salary.createdby.lastname || ""}`.trim()
        : "Not Specified",
      salary_month: salary.duedate
        ? new Date(salary.duedate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
          })
        : "Not Specified",
      dueDate: salary.duedate
        ? new Date(salary.duedate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : "Not Specified",
      statusColor: salary.status === "Paid" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                   salary.status === "Delayed" ? "bg-orange-100 text-orange-700 border-orange-200" : 
                   "bg-red-100 text-red-700 border-red-200",
    }));
  }, [salaries]);

  const columns = useMemo(
    () => [
      { key: "employeeName", label: "Employee Name" },
      { key: "salary_month", label: "Salary Month" },
      { key: "basicpay", label: "Basic Pay" },
      { key: "netpay", label: "Net Pay" },
      { key: "currency", label: "Currency" },
      { key: "dueDate", label: "Due Date" },
      { key: "status", label: "Status" },
    ],
    []
  );

  return (
    <div className="w-full mx-auto flex flex-col gap-6 animate-fade-in-up">
      {/* Header Card */}
      <Card className="frosted-card border-transparent shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/15 via-emerald-400/15 to-teal-500/15">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">My Salaries</CardTitle>
                <CardDescription className="text-base mt-1">
                  View your salary records and payment history
                </CardDescription>
              </div>
            </div>
            {loadingSalaries && (
              <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            )}
          </div>
        </CardHeader>
      </Card>

      <DataTable
        title="Salary Records"
        description={`${transformedSalaries.length} salary record${transformedSalaries.length !== 1 ? 's' : ''} available`}
        data={transformedSalaries}
        columns={columns}
        loading={loadingSalaries}
        error={errorSalaries}
        cardClassName="m-0 w-full frosted-card border-transparent shadow-lg"
        onRefresh={loadSalaries}
      />
    </div>
  );
};

