import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/redux/apis/APIService";
import {
  EmployeeNoticeEndPoints,
  EmployeeLeavesEndPoints,
  EmployeeRequestsEndPoints,
  EmployeeAttendanceEndPoints,
  EmployeeSalaryEndPoints,
  EmployeeProfileEndPoints,
} from "@/redux/apis/APIsEndpoints";
import DataTable from "@/components/common/DataTable.jsx";
import { HandleEmployeeLogout } from "@/redux/Thunks/EmployeeThunk.js";
import { useToast } from "@/hooks/use-toast.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { EmployeeSidebar } from "@/components/ui/EmployeeSidebar.jsx";

export const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tab, setTab] = useState("notices");
  const [me, setMe] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstname: "",
    lastname: "",
    contactnumber: "",
  });

  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [errorNotices, setErrorNotices] = useState("");

  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [errorLeaves, setErrorLeaves] = useState("");
  const [newLeave, setNewLeave] = useState(null);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [errorRequests, setErrorRequests] = useState("");
  const [newRequest, setNewRequest] = useState(null);

  const [attendance, setAttendance] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [errorAttendance, setErrorAttendance] = useState("");

  const [salaries, setSalaries] = useState([]);
  const [loadingSalaries, setLoadingSalaries] = useState(false);
  const [errorSalaries, setErrorSalaries] = useState("");

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
      })),
    [requests]
  );

  const onLogout = useCallback(async () => {
    try {
      const result = await dispatch(HandleEmployeeLogout());
      if (result?.payload?.success) {
        toast({ title: "Logged out" });
        navigate("/auth/employee/login");
      } else {
        throw new Error(result?.payload?.message || "Logout failed");
      }
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [dispatch, navigate, toast]);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await apiService.get(EmployeeProfileEndPoints.GET, {
        withCredentials: true,
      });
      const data = res.data?.data;
      if (data) {
        setMe(data);
        setProfileForm({
          firstname: data.firstname || "",
          lastname: data.lastname || "",
          contactnumber: data.contactnumber || "",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to load profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  }, [toast]);

  const loadNotices = useCallback(async () => {
    setLoadingNotices(true);
    setErrorNotices("");
    try {
      const res = await apiService.get(EmployeeNoticeEndPoints.GETALL, {
        withCredentials: true,
      });
      setNotices(res.data?.data || []);
    } catch (error) {
      setErrorNotices(
        error.response?.data?.message ||
          error.message ||
          "Unable to load notices"
      );
    } finally {
      setLoadingNotices(false);
    }
  }, []);

  const loadLeaves = useCallback(async () => {
    setLoadingLeaves(true);
    setErrorLeaves("");
    try {
      const res = await apiService.get(EmployeeLeavesEndPoints.MY, {
        withCredentials: true,
      });
      setLeaves(res.data?.data || []);
    } catch (error) {
      setErrorLeaves(
        error.response?.data?.message ||
          error.message ||
          "Unable to load leaves"
      );
    } finally {
      setLoadingLeaves(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    setErrorRequests("");
    try {
      const res = await apiService.get(EmployeeRequestsEndPoints.MY, {
        withCredentials: true,
      });
      setRequests(res.data?.data || []);
    } catch (error) {
      setErrorRequests(
        error.response?.data?.message ||
          error.message ||
          "Unable to load requests"
      );
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    setLoadingAttendance(true);
    setErrorAttendance("");
    try {
      const res = await apiService.get(EmployeeAttendanceEndPoints.MY, {
        withCredentials: true,
      });
      const data = res.data?.data;
      setAttendance(data);
      setAttendanceLogs(data?.attendancelog || []);
    } catch (error) {
      setErrorAttendance(
        error.response?.data?.message ||
          error.message ||
          "Unable to load attendance"
      );
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  const loadSalaries = useCallback(async () => {
    setLoadingSalaries(true);
    setErrorSalaries("");
    try {
      const res = await apiService.get(EmployeeSalaryEndPoints.MY, {
        withCredentials: true,
      });
      setSalaries(res.data?.data || []);
    } catch (error) {
      setErrorSalaries(
        error.response?.data?.message ||
          error.message ||
          "Unable to load salaries"
      );
    } finally {
      setLoadingSalaries(false);
    }
  }, []);

  const saveProfile = useCallback(async () => {
    if (!me?._id) return;
    setProfileSaving(true);
    try {
      const res = await apiService.put(
        EmployeeProfileEndPoints.UPDATE,
        {
          employeeId: me._id,
          updatedEmployee: {
            firstname: profileForm.firstname,
            lastname: profileForm.lastname,
            contactnumber: profileForm.contactnumber,
          },
        },
        { withCredentials: true }
      );
      const updated = res.data?.data;
      setMe(updated || me);
      setProfileEditing(false);
      toast({ title: "Profile updated" });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProfileSaving(false);
    }
  }, [me, profileForm, toast]);

  const openNewLeave = () => {
    setNewLeave({ title: "", reason: "", startdate: "", enddate: "" });
  };

  const submitNewLeave = async () => {
    if (!me?._id) {
      toast({ title: "Profile not loaded yet" });
      return;
    }
    try {
      await apiService.post(
        EmployeeLeavesEndPoints.CREATE,
        { ...newLeave, employeeID: me._id },
        { withCredentials: true }
      );
      toast({ title: "Leave created" });
      setNewLeave(null);
      loadLeaves();
    } catch (error) {
      toast({
        title: "Could not create leave",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
      toast({ title: "Request submitted" });
      setNewRequest(null);
      loadRequests();
    } catch (error) {
      toast({
        title: "Could not submit request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const initializeAttendance = async () => {
    if (!me?._id) {
      toast({ title: "Profile not loaded yet" });
      return;
    }
    try {
      await apiService.post(
        EmployeeAttendanceEndPoints.INITIALIZE,
        { employeeID: me._id },
        { withCredentials: true }
      );
      toast({ title: "Attendance initialized" });
      loadAttendance();
    } catch (error) {
      toast({
        title: "Could not initialize attendance",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markToday = async (status) => {
    if (!attendance?._id) return;
    // Use local date (not UTC) so it matches the user's actual day
    const now = new Date();
    const currentdate = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    try {
      await apiService.put(
        EmployeeAttendanceEndPoints.UPDATE,
        { attendanceID: attendance._id, status, currentdate },
        { withCredentials: true }
      );
      loadAttendance();
    } catch (error) {
      toast({
        title: "Could not update attendance",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadProfile();
    loadNotices();
    loadLeaves();
    loadRequests();
    loadAttendance();
    loadSalaries();
  }, [
    loadProfile,
    loadNotices,
    loadLeaves,
    loadRequests,
    loadAttendance,
    loadSalaries,
  ]);

  return (
    <SidebarProvider>
      <EmployeeSidebar active={tab} onSelect={setTab} onLogout={onLogout} />
      <SidebarInset className="bg-gray-50">
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger aria-label="Toggle navigation" />
            <div>
              <h1 className="text-xl font-semibold">Employee Dashboard</h1>
              <p className="text-sm text-gray-700">
                Stay on top of notices, requests, attendance, and pay.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            disabled={loadingProfile}
          >
            Logout
          </Button>
        </div>

        <div className="px-4 pb-6 space-y-6">
          {tab === "notices" && (
            <DataTable
              title="Notices"
              description="Company and department notices"
              data={notices}
              loading={loadingNotices}
              error={errorNotices}
              onRefresh={loadNotices}
            />
          )}

          {tab === "leaves" && (
            <>
              <DataTable
                title="My Leaves"
                description="Your leave requests"
                data={leaves}
                loading={loadingLeaves}
                error={errorLeaves}
                onRefresh={loadLeaves}
                onCreate={openNewLeave}
              />

              {newLeave && (
                <Modal title="New Leave" onClose={() => setNewLeave(null)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LabeledInput
                      label="Title"
                      value={newLeave.title}
                      onChange={(v) => setNewLeave((s) => ({ ...s, title: v }))}
                    />
                    <LabeledInput
                      label="Reason"
                      value={newLeave.reason}
                      onChange={(v) =>
                        setNewLeave((s) => ({ ...s, reason: v }))
                      }
                    />
                    <LabeledInput
                      label="Start date"
                      type="date"
                      value={newLeave.startdate}
                      onChange={(v) =>
                        setNewLeave((s) => ({ ...s, startdate: v }))
                      }
                    />
                    <LabeledInput
                      label="End date"
                      type="date"
                      value={newLeave.enddate}
                      onChange={(v) =>
                        setNewLeave((s) => ({ ...s, enddate: v }))
                      }
                    />
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setNewLeave(null)}>
                      Cancel
                    </Button>
                    <Button onClick={submitNewLeave}>Create</Button>
                  </div>
                </Modal>
              )}
            </>
          )}

          {tab === "requests" && (
            <>
              <DataTable
                title="My Requests"
                description="Requests you generated"
                data={requestRows}
                columns={requestColumns}
                loading={loadingRequests}
                error={errorRequests}
                onRefresh={loadRequests}
                onCreate={openNewRequest}
              />

              {newRequest && (
                <Modal title="New Request" onClose={() => setNewRequest(null)}>
                  <div className="grid grid-cols-1 gap-3">
                    <LabeledInput
                      label="Title"
                      value={newRequest.requesttitle}
                      onChange={(v) =>
                        setNewRequest((s) => ({ ...s, requesttitle: v }))
                      }
                    />
                    <LabeledInput
                      label="Content"
                      value={newRequest.requestconent}
                      onChange={(v) =>
                        setNewRequest((s) => ({ ...s, requestconent: v }))
                      }
                    />
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setNewRequest(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={submitNewRequest}>Create</Button>
                  </div>
                </Modal>
              )}
            </>
          )}

          {tab === "attendance" && (
            <Card className="m-0">
              <CardHeader>
                <CardTitle>My Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {errorAttendance && (
                  <div className="text-sm text-red-600 mb-3">
                    {errorAttendance}
                  </div>
                )}
                {loadingAttendance ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 bg-gray-100 animate-pulse rounded"
                      />
                    ))}
                  </div>
                ) : !attendance ? (
                  <div className="flex items-center justify-between">
                    <div>No attendance record yet.</div>
                    <Button onClick={initializeAttendance}>Initialize</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      <Button onClick={() => markToday("Present")}>
                        Mark Present
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => markToday("Absent")}
                      >
                        Mark Absent
                      </Button>
                    </div>
                    <div className="overflow-auto border rounded-md">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left font-medium text-gray-700 px-3 py-2">
                              Date
                            </th>
                            <th className="text-left font-medium text-gray-700 px-3 py-2">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceLogs.map((l, idx) => (
                            <tr
                              key={idx}
                              className="odd:bg-white even:bg-gray-50"
                            >
                              <td className="px-3 py-2">
                                {
                                  new Date(l.logdate || l.date)
                                    .toISOString()
                                    .split("T")[0]
                                }
                              </td>
                              <td className="px-3 py-2">
                                {l.logstatus || l.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {tab === "salaries" && (
            <DataTable
              title="My Salaries"
              description="Your salary records"
              data={salaries}
              loading={loadingSalaries}
              error={errorSalaries}
              onRefresh={loadSalaries}
            />
          )}

          {tab === "profile" && (
            <Card className="m-0">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>My Profile</CardTitle>
                  {me && (
                    <Button
                      variant={profileEditing ? "outline" : "default"}
                      size="sm"
                      onClick={() => setProfileEditing((v) => !v)}
                      disabled={profileSaving}
                    >
                      {profileEditing ? "Cancel" : "Edit"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {(!me && loadingProfile) || (!me && !loadingProfile) ? (
                  <div className="text-sm text-gray-600">Loading...</div>
                ) : !profileEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Detail label="First name" value={me?.firstname} />
                    <Detail label="Last name" value={me?.lastname} />
                    <Detail label="Email" value={me?.email} />
                    <Detail label="Contact" value={me?.contactnumber} />
                    <Detail
                      label="Department"
                      value={
                        typeof me?.department === "object"
                          ? me?.department?.name
                          : me?.department || "-"
                      }
                    />
                    <Detail
                      label="Verified"
                      value={me?.isverified ? "Yes" : "No"}
                    />
                    {me?.status && (
                      <Detail label="Status" value={me?.status || "Active"} />
                    )}
                  </div>
                ) : (
                  <form
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await saveProfile();
                    }}
                  >
                    <EditableField
                      label="First name"
                      value={profileForm.firstname}
                      onChange={(v) =>
                        setProfileForm((s) => ({ ...s, firstname: v }))
                      }
                    />
                    <EditableField
                      label="Last name"
                      value={profileForm.lastname}
                      onChange={(v) =>
                        setProfileForm((s) => ({ ...s, lastname: v }))
                      }
                    />
                    <Detail label="Email" value={me?.email} />
                    <EditableField
                      label="Contact"
                      value={profileForm.contactnumber}
                      onChange={(v) =>
                        setProfileForm((s) => ({ ...s, contactnumber: v }))
                      }
                    />
                    <Detail
                      label="Department"
                      value={
                        typeof me?.department === "object"
                          ? me?.department?.name
                          : me?.department || "-"
                      }
                    />
                    {me?.status && (
                      <Detail label="Status" value={me?.status || "Active"} />
                    )}
                    <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setProfileEditing(false)}
                        disabled={profileSaving}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={profileSaving}>
                        {profileSaving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-gray-800 break-words">{value ?? "-"}</div>
    </div>
  );
}

function EditableField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow max-w-lg w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500">
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
      <label className="text-sm text-gray-700">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
