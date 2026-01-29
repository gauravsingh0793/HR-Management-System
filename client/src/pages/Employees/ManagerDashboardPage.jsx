import { useEffect, useMemo, useState } from "react";
import { apiService } from "@/redux/apis/APIService";
import {
  EmployeeProfileEndPoints,
  ManagerEndPoints,
} from "@/redux/apis/APIsEndpoints";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, ListTodo, Star } from "lucide-react";

export const ManagerDashboardPage = () => {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [tasks, setTasks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployeeData, setLoadingEmployeeData] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [creatingReview, setCreatingReview] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState("");

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "Medium",
  });

  const [reviewForm, setReviewForm] = useState({
    softSkills: "3",
    behavioral: "3",
    communication: "3",
    comments: "",
  });

  // Derived performance summary from existing reviews
  const reviewSummary = useMemo(() => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return {
        weekAvg: null,
        monthAvg: null,
        yearAvg: null,
        total: 0,
      };
    }

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);
    const yearAgo = new Date(now);
    yearAgo.setFullYear(now.getFullYear() - 1);

    let weekSum = 0,
      weekCount = 0;
    let monthSum = 0,
      monthCount = 0;
    let yearSum = 0,
      yearCount = 0;

    reviews.forEach((r) => {
      if (!r || typeof r.overallScore !== "number" || !r.createdAt) return;
      const created = new Date(r.createdAt);

      if (created >= weekAgo && created <= now) {
        weekSum += r.overallScore;
        weekCount += 1;
      }
      if (created >= monthAgo && created <= now) {
        monthSum += r.overallScore;
        monthCount += 1;
      }
      if (created >= yearAgo && created <= now) {
        yearSum += r.overallScore;
        yearCount += 1;
      }
    });

    const safeAvg = (sum, count) =>
      count > 0 ? Number((sum / count).toFixed(2)) : null;

    return {
      weekAvg: safeAvg(weekSum, weekCount),
      monthAvg: safeAvg(monthSum, monthCount),
      yearAvg: safeAvg(yearSum, yearCount),
      total: reviews.length,
    };
  }, [reviews]);

  const isManager = useMemo(() => me?.role === "Manager", [me]);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await apiService.get(EmployeeProfileEndPoints.GET, {
          withCredentials: true,
        });
        setMe(res.data?.data || null);
      } catch (error) {
        // ignore
      }
    };
    loadMe();
  }, []);

  useEffect(() => {
    if (!isManager) return;
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const res = await apiService.get(ManagerEndPoints.EMPLOYEES, {
          withCredentials: true,
        });
        setEmployees(res.data?.data || []);
      } catch {
        toast({
          title: "Unable to load employees",
          description: "Try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
  }, [isManager, toast]);

  useEffect(() => {
    if (!isManager || !selectedEmployee) {
      // Reset tasks and reviews when no employee is selected
      setTasks([]);
      setReviews([]);
      return;
    }
    const loadDetails = async () => {
      setLoadingEmployeeData(true);
      try {
        const [tasksRes, reviewsRes] = await Promise.all([
          apiService.get(
            ManagerEndPoints.TASKS_FOR_EMPLOYEE(selectedEmployee),
            {
              withCredentials: true,
            },
          ),
          apiService.get(
            ManagerEndPoints.REVIEWS_FOR_EMPLOYEE(selectedEmployee),
            {
              withCredentials: true,
            },
          ),
        ]);
        setTasks(tasksRes.data?.data || []);
        setReviews(reviewsRes.data?.data || []);
      } catch {
        toast({
          title: "Failed to load data",
          description: "Try again later",
          variant: "destructive",
        });
      } finally {
        setLoadingEmployeeData(false);
      }
    };
    loadDetails();
  }, [isManager, selectedEmployee, toast]);

  const onCreateTask = async () => {
    if (!selectedEmployee || !taskForm.title.trim()) {
      toast({
        title: "Task title and employee required",
        variant: "destructive",
      });
      return;
    }
    setCreatingTask(true);
    try {
      const payload = {
        employeeID: selectedEmployee,
        title: taskForm.title,
        description: taskForm.description,
        deadline: taskForm.deadline || undefined,
        priority: taskForm.priority,
      };
      const res = await apiService.post(ManagerEndPoints.CREATE_TASK, payload, {
        withCredentials: true,
      });
      const created = res.data?.data;
      if (created) {
        setTasks((prev) => [created, ...prev]);
        setTaskForm({
          title: "",
          description: "",
          deadline: "",
          priority: "Medium",
        });
        toast({ title: "Task created" });
      }
    } catch (error) {
      toast({
        title: "Failed to create task",
        description:
          error.response?.data?.message || error.message || "Try again later",
        variant: "destructive",
      });
    } finally {
      setCreatingTask(false);
    }
  };

  const onCreateReview = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Select an employee first",
        variant: "destructive",
      });
      return;
    }
    setCreatingReview(true);
    try {
      const payload = {
        employeeID: selectedEmployee,
        softSkills: Number(reviewForm.softSkills),
        behavioral: Number(reviewForm.behavioral),
        communication: Number(reviewForm.communication),
        comments: reviewForm.comments,
      };
      const res = await apiService.post(
        ManagerEndPoints.CREATE_REVIEW,
        payload,
        {
          withCredentials: true,
        },
      );
      const created = res.data?.data;
      if (created) {
        setReviews((prev) => [created, ...prev]);
        setReviewForm({
          softSkills: "3",
          behavioral: "3",
          communication: "3",
          comments: "",
        });
        toast({ title: "Review added" });
      }
    } catch (error) {
      toast({
        title: "Failed to create review",
        description:
          error.response?.data?.message || error.message || "Try again later",
        variant: "destructive",
      });
    } finally {
      setCreatingReview(false);
    }
  };

  const onUpdateTaskStatus = async (taskId, status) => {
    if (!taskId || !status) return;
    setUpdatingTaskId(taskId);
    try {
      const res = await apiService.patch(
        ManagerEndPoints.UPDATE_TASK_STATUS,
        { taskID: taskId, status },
        { withCredentials: true },
      );
      const updated = res.data?.data;
      if (updated) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
        if (status === "Completed") {
          toast({
            title: "Task marked completed",
            description:
              "A performance entry has been recorded for this completion.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Failed to update task",
        description:
          error.response?.data?.message || error.message || "Try again later",
        variant: "destructive",
      });
    } finally {
      setUpdatingTaskId("");
    }
  };

  if (!me) {
    return (
      <div className="text-sm text-slate-600">Loading your profile...</div>
    );
  }

  if (!isManager) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6 text-sm text-slate-700">
          This section is available only for employees with the Manager role.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Manager Panel
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Assign tasks with deadlines and add performance reviews for your
                team.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="w-full md:w-72">
              <select
                className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">Select employee</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {`${e.firstname || ""} ${e.lastname || ""}`.trim() ||
                      e.email ||
                      "Employee"}
                  </option>
                ))}
              </select>
            </div>
            {loading && (
              <p className="text-xs text-slate-500">Loading employees...</p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <div
          key={selectedEmployee}
          className="grid gap-4 lg:grid-cols-2 items-start"
        >
          {loadingEmployeeData ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <div className="text-sm text-slate-600">
                Loading employee data...
              </div>
            </div>
          ) : (
            <>
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <ListTodo className="w-4 h-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Add Task
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Task title"
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                  <Textarea
                    placeholder="Task description (optional)"
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="date"
                      value={taskForm.deadline}
                      onChange={(e) =>
                        setTaskForm((f) => ({ ...f, deadline: e.target.value }))
                      }
                    />
                    <select
                      className="w-full sm:w-40 border border-slate-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      value={taskForm.priority}
                      onChange={(e) =>
                        setTaskForm((f) => ({ ...f, priority: e.target.value }))
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <Button
                    className="mt-1"
                    onClick={onCreateTask}
                    disabled={creatingTask}
                  >
                    {creatingTask ? "Saving..." : "Add Task"}
                  </Button>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Existing Tasks
                    </p>
                    {tasks.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No tasks added yet for this employee.
                      </p>
                    ) : (
                      tasks.map((t) => (
                        <div
                          key={t._id}
                          className="flex items-start justify-between gap-3 p-2 rounded-lg border border-slate-100 bg-slate-50/60"
                        >
                          <div className="text-xs space-y-0.5">
                            <div className="font-semibold text-slate-900">
                              {t.title}
                            </div>
                            {t.deadline && (
                              <div className="text-slate-500 mt-0.5">
                                Deadline:{" "}
                                {new Date(t.deadline).toLocaleDateString()}
                              </div>
                            )}
                            {t.status && (
                              <div className="text-[11px] mt-0.5">
                                Status:{" "}
                                <span className="font-medium">{t.status}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {t.priority || "Medium"}
                            </span>
                            {t.status !== "Completed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingTaskId === t._id}
                                onClick={() =>
                                  onUpdateTaskStatus(t._id, "Completed")
                                }
                                className="h-7 px-2 text-[11px]"
                              >
                                {updatingTaskId === t._id
                                  ? "Marking..."
                                  : "Mark completed"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Star className="w-4 h-4 text-amber-600" />
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Add Performance Review
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="mb-1 text-slate-600">Soft Skills</p>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={reviewForm.softSkills}
                        onChange={(e) =>
                          setReviewForm((f) => ({
                            ...f,
                            softSkills: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-slate-600">Behavioral</p>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={reviewForm.behavioral}
                        onChange={(e) =>
                          setReviewForm((f) => ({
                            ...f,
                            behavioral: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-slate-600">Communication</p>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={reviewForm.communication}
                        onChange={(e) =>
                          setReviewForm((f) => ({
                            ...f,
                            communication: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    Note: Performance score is auto-calculated from attendance
                    records and deadline adherence
                  </p>
                  <Textarea
                    placeholder="Review comments (optional)"
                    value={reviewForm.comments}
                    onChange={(e) =>
                      setReviewForm((f) => ({ ...f, comments: e.target.value }))
                    }
                  />
                  <Button
                    className="mt-1"
                    onClick={onCreateReview}
                    disabled={creatingReview}
                  >
                    {creatingReview ? "Saving..." : "Add Review"}
                  </Button>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Previous Reviews
                    </p>
                    <div className="text-[11px] text-slate-600 mb-1 flex flex-wrap gap-2">
                      <span>Week avg: {reviewSummary.weekAvg ?? "-"} / 5</span>
                      <span className="mx-1">•</span>
                      <span>
                        Month avg: {reviewSummary.monthAvg ?? "-"} / 5
                      </span>
                      <span className="mx-1">•</span>
                      <span>Year avg: {reviewSummary.yearAvg ?? "-"} / 5</span>
                      <span className="mx-1">•</span>
                      <span>Total reviews: {reviewSummary.total}</span>
                    </div>
                    {reviews.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No reviews added yet for this employee.
                      </p>
                    ) : (
                      reviews.map((r) => (
                        <div
                          key={r._id}
                          className="p-2 rounded-lg border border-slate-100 bg-slate-50/60 text-xs space-y-1"
                        >
                          <div className="flex items-center gap-2 text-slate-900 font-semibold">
                            <Star className="w-3 h-3 text-amber-500" />
                            <span>
                              {r.overallScore?.toFixed(1) || "-"}/5 overall
                            </span>
                          </div>
                          <div className="text-slate-600 space-y-0.5">
                            <div>
                              Soft Skills: {r.softSkills || "-"}/5 • Behavioral:{" "}
                              {r.behavioral || "-"}/5 • Communication:{" "}
                              {r.communication || "-"}/5
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Performance:{" "}
                              {r.performanceScore?.toFixed(1) || "-"}/5
                              (auto-calculated from attendance + deadlines)
                            </div>
                          </div>
                          {r.comments && (
                            <div className="text-slate-700 mt-1">
                              {r.comments}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};
