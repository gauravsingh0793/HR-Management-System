import { useEffect, useState, useMemo } from "react";
import { apiService } from "@/redux/apis/APIService";
import { EmployeeTaskEndPoints } from "@/redux/apis/APIsEndpoints";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListTodo, MessageCircle, CheckCircle2, Clock3 } from "lucide-react";

export const EmployeeTasksPage = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [messageByTask, setMessageByTask] = useState({});

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const res = await apiService.get(EmployeeTaskEndPoints.MY_TASKS, {
          withCredentials: true,
        });
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setTasks(res.data.data);
          if (!activeTaskId && res.data.data.length > 0) {
            setActiveTaskId(res.data.data[0]._id);
          }
        }
      } catch (error) {
        toast({
          title: "Unable to load tasks",
          description:
            error.response?.data?.message || "Please try again in a moment",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [toast, activeTaskId]);

  const activeTask = useMemo(
    () => tasks.find((t) => t._id === activeTaskId) || null,
    [tasks, activeTaskId]
  );

  const onSendMessage = async (taskId) => {
    const text = (messageByTask[taskId] || "").trim();
    if (!text) return;

    try {
      const res = await apiService.post(
        EmployeeTaskEndPoints.ADD_COMMENT,
        { taskID: taskId, message: text },
        { withCredentials: true }
      );
      if (res.data?.success && res.data?.data) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data.data : t))
        );
        setMessageByTask((prev) => ({ ...prev, [taskId]: "" }));
      }
    } catch (error) {
      toast({
        title: "Failed to send message",
        description:
          error.response?.data?.message || "Please try again in a moment",
        variant: "destructive",
      });
    }
  };

  const renderStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "completed")
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Completed
        </span>
      );
    if (s === "in progress")
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          In progress
        </span>
      );
    if (s === "overdue")
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Overdue
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
        Pending
      </span>
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)] min-h-[400px]">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50">
              <ListTodo className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                My Tasks
              </CardTitle>
              <p className="text-xs text-slate-500">
                Tasks assigned by your manager with status.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <p className="text-xs text-slate-500 py-4">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              No tasks have been assigned to you yet.
            </p>
          ) : (
            <div className="max-h-[420px] pr-2 overflow-y-auto">
              <div className="space-y-2">
                {tasks.map((task) => {
                  const managerName = task.createdBy
                    ? `${task.createdBy.firstname || ""} ${
                        task.createdBy.lastname || ""
                      }`.trim() ||
                      task.createdBy.email ||
                      "Manager"
                    : "Manager";
                  const isActive = task._id === activeTaskId;

                  return (
                    <button
                      key={task._id}
                      type="button"
                      onClick={() => setActiveTaskId(task._id)}
                      className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 flex flex-col gap-1.5 ${
                        isActive
                          ? "border-blue-500 bg-blue-50/60 shadow-sm"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900 line-clamp-1">
                          {task.title || "Untitled task"}
                        </p>
                        {renderStatusBadge(task.status)}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        Manager: {managerName}
                      </p>
                      {task.deadline && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock3 className="w-3 h-3" />
                          Due {new Date(task.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Task conversation
              </CardTitle>
              <p className="text-xs text-slate-500">
                Chat with your manager about the selected task.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex flex-col h-full">
          {activeTask ? (
            <>
              <div className="mb-3 pb-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  {activeTask.title || "Untitled task"}
                </p>
                {activeTask.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {activeTask.description}
                  </p>
                )}
              </div>

              <div className="flex-1 min-h-[220px] max-h-[320px] pr-2 mb-3 overflow-y-auto">
                <div className="space-y-2 text-sm">
                  {(activeTask.comments || []).length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No messages yet. Start the conversation with your manager.
                    </p>
                  ) : (
                    activeTask.comments
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(a.createdAt || 0) -
                          new Date(b.createdAt || 0)
                      )
                      .map((c, idx) => {
                        const isEmployee = c.senderRole === "Employee";
                        const senderName = c.sender
                          ? `${c.sender.firstname || ""} ${
                              c.sender.lastname || ""
                            }`.trim() ||
                            c.sender.email ||
                            c.senderRole
                          : c.senderRole;
                        return (
                          <div
                            key={idx}
                            className={`flex w-full ${
                              isEmployee ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-3 py-2 text-xs shadow-sm ${
                                isEmployee
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              <p className="font-semibold mb-0.5 text-[11px]">
                                {isEmployee ? "You" : senderName}
                              </p>
                              <p className="whitespace-pre-wrap break-words">
                                {c.message}
                              </p>
                              {c.createdAt && (
                                <p
                                  className={`mt-0.5 text-[10px] ${
                                    isEmployee
                                      ? "text-blue-100/80"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {new Date(c.createdAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100">
                <Input
                  placeholder="Type your message to your manager..."
                  value={messageByTask[activeTask._id] || ""}
                  onChange={(e) =>
                    setMessageByTask((prev) => ({
                      ...prev,
                      [activeTask._id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSendMessage(activeTask._id);
                    }
                  }}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => onSendMessage(activeTask._id)}
                  className="flex items-center gap-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send
                </Button>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 py-4">
              Select a task from the left to view the conversation.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
