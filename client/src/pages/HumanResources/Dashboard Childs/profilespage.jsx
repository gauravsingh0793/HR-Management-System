import { useEffect, useMemo, useState, useCallback } from "react";
import { apiService } from "@/redux/apis/APIService";
import {
  HRProfilesEndPoints,
  HRDepartmentPageEndPoints,
} from "@/redux/apis/APIsEndpoints";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { useToast } from "@/hooks/use-toast.js";
import {
  Edit2,
  Save,
  X,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  XCircle,
  User,
  Upload,
} from "lucide-react";

export function HRProfilesPage() {
  const { toast } = useToast();
  const [hr, setHr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    contactnumber: "",
    department: "",
  });

  const initials = useMemo(() => {
    const first =
      form.firstname?.charAt(0)?.toUpperCase() ||
      hr?.firstname?.charAt(0)?.toUpperCase() ||
      "H";
    const last =
      form.lastname?.charAt(0)?.toUpperCase() ||
      hr?.lastname?.charAt(0)?.toUpperCase() ||
      "R";
    return `${first}${last}`;
  }, [form.firstname, form.lastname, hr]);

  const loadHR = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(HRProfilesEndPoints.GETALL, {
        withCredentials: true,
      });
      const rows = Array.isArray(res.data?.data) ? res.data.data : res.data;
      const first = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (first) {
        setHr(first);
        setAvatarPreview(first.profileimage || "");
        setForm({
          firstname: first.firstname || "",
          lastname: first.lastname || "",
          contactnumber: first.contactnumber || "",
          department: first.department?._id || first.department || "",
        });
      }
    } catch (e) {
      console.error("Failed to load HR profile", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const res = await apiService.get(HRDepartmentPageEndPoints.GETALL, {
        withCredentials: true,
      });
      const rows = Array.isArray(res.data?.data) ? res.data.data : res.data;
      setDepartments(Array.isArray(rows) ? rows : []);
    } catch {
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    loadHR();
  }, [loadHR]);

  const onSave = useCallback(async () => {
    if (!hr?._id || saving) return;
    setSaving(true);
    try {
      // Compress image if present and not already a URL
      const compressImage = (dataUri) => {
        return new Promise((resolve, reject) => {
          if (!dataUri || dataUri.startsWith("http")) return resolve(dataUri);
          const img = new Image();
          img.onerror = () => reject(new Error("Failed to load image"));
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            // Start with lower quality and reduce if needed
            let quality = 0.5;
            let compressed = canvas.toDataURL("image/jpeg", quality);

            // If still too large, reduce quality further
            while (compressed.length > 500000 && quality > 0.1) {
              quality -= 0.1;
              compressed = canvas.toDataURL("image/jpeg", quality);
            }

            resolve(compressed);
          };
          img.src = dataUri;
        });
      };

      const Updatedata = {
        firstname: form.firstname,
        lastname: form.lastname,
        contactnumber: form.contactnumber,
      };
      if (form.department) Updatedata.department = form.department;

      // Compress and include image if present
      if (avatarPreview && !avatarPreview.startsWith("http")) {
        const compressed = await compressImage(avatarPreview);
        if (compressed) {
          Updatedata.profileimage = compressed;
        }
      }

      const res = await apiService.patch(
        HRProfilesEndPoints.UPDATE,
        { HRID: hr._id, Updatedata },
        { withCredentials: true },
      );

      const updated = res.data?.data;
      if (updated) {
        setHr(updated);
        setAvatarPreview(updated.profileimage || "");
        setForm({
          firstname: updated.firstname || "",
          lastname: updated.lastname || "",
          contactnumber: updated.contactnumber || "",
          department: updated.department?._id || updated.department || "",
        });
        toast({ title: "Profile updated" });
        // Trigger sidebar refresh
        window.dispatchEvent(new CustomEvent("profileUpdated"));
      } else {
        toast({
          title: "Profile updated",
          description: "Saved, but response was empty.",
        });
      }
      setEditing(false);
    } catch (e) {
      const description =
        e?.response?.data?.message || e.message || "Update failed";
      toast({ title: "Update failed", description, variant: "destructive" });
      console.error("Update failed", e);
      console.error("Error details:", {
        status: e?.response?.status,
        statusText: e?.response?.statusText,
        data: e?.response?.data,
      });
    } finally {
      setSaving(false);
    }
  }, [
    avatarPreview,
    form.contactnumber,
    form.department,
    form.firstname,
    form.lastname,
    hr?._id,
    saving,
    toast,
  ]);

  const startEdit = async () => {
    await loadDepartments();
    setEditing(true);
  };

  const handleAvatar = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  if (loading && !hr) {
    return (
      <div className="h-full overflow-auto p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!hr) {
    return (
      <div className="p-6 text-center text-gray-600">No HR profile found.</div>
    );
  }

  const avatarSrc = avatarPreview || hr?.profileimage || "";

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-2 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover shadow-lg ring-4 ring-blue-100"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-blue-100">
                    {initials}
                  </div>
                )}
                {editing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-all cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAvatar(e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {`${form.firstname || hr.firstname || ""} ${
                    form.lastname || hr.lastname || ""
                  }`.trim() || "HR Admin"}
                </h1>
                <p className="text-gray-600 mb-4 flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-4 h-4" />
                  {hr?.email || "-"}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge
                    icon={hr?.isverified ? CheckCircle2 : XCircle}
                    label={hr?.isverified ? "Verified" : "Not Verified"}
                    variant={hr?.isverified ? "success" : "warning"}
                  />
                  <Badge
                    icon={Building2}
                    label={
                      typeof hr?.department === "object"
                        ? hr?.department?.name
                        : hr?.department || "HR"
                    }
                    variant="info"
                  />
                </div>
              </div>

              <Button
                variant={editing ? "secondary" : "default"}
                size="default"
                onClick={() => (editing ? setEditing(false) : startEdit())}
                disabled={saving}
                className="flex items-center gap-2 h-10 px-4 font-semibold"
              >
                {editing ? (
                  <>
                    <X className="w-4 h-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            {!editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailCard
                  icon={User}
                  label="First Name"
                  value={hr?.firstname || "-"}
                />
                <DetailCard
                  icon={User}
                  label="Last Name"
                  value={hr?.lastname || "-"}
                />
                <DetailCard
                  icon={Mail}
                  label="Email Address"
                  value={hr?.email || "-"}
                />
                <DetailCard
                  icon={Phone}
                  label="Contact Number"
                  value={hr?.contactnumber || "-"}
                />
                <DetailCard
                  icon={Building2}
                  label="Department"
                  value={
                    typeof hr?.department === "object"
                      ? hr?.department?.name
                      : hr?.department || "-"
                  }
                />
                <DetailCard
                  icon={hr?.isverified ? CheckCircle2 : XCircle}
                  label="Verification Status"
                  value={hr?.isverified ? "Verified" : "Not Verified"}
                />
              </div>
            ) : (
              <form
                className="space-y-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await onSave();
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableField
                    icon={User}
                    label="First Name"
                    value={form.firstname}
                    onChange={(v) => setForm((s) => ({ ...s, firstname: v }))}
                    required
                  />
                  <EditableField
                    icon={User}
                    label="Last Name"
                    value={form.lastname}
                    onChange={(v) => setForm((s) => ({ ...s, lastname: v }))}
                    required
                  />
                  <DetailCard
                    icon={Mail}
                    label="Email Address"
                    value={hr?.email || "-"}
                    readOnly
                  />
                  <EditableField
                    icon={Phone}
                    label="Contact Number"
                    value={form.contactnumber}
                    onChange={(v) =>
                      setForm((s) => ({ ...s, contactnumber: v }))
                    }
                    type="tel"
                  />
                  <div className="p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <label className="text-sm font-medium text-gray-600">
                        Department
                      </label>
                    </div>
                    <select
                      className="ml-11 mt-1 w-full border rounded px-3 py-2 text-sm"
                      value={form.department}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, department: e.target.value }))
                      }
                    >
                      <option value="">Unassigned</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name || d.departmentname || d._id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <DetailCard
                    icon={hr?.isverified ? CheckCircle2 : XCircle}
                    label="Verification Status"
                    value={hr?.isverified ? "Verified" : "Not Verified"}
                    readOnly
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        firstname: hr?.firstname || "",
                        lastname: hr?.lastname || "",
                        contactnumber: hr?.contactnumber || "",
                        department: hr?.department?._id || hr?.department || "",
                      });
                      setAvatarPreview(hr?.profileimage || "");
                    }}
                    disabled={saving}
                    className="flex items-center gap-2 h-10 px-4 font-semibold text-slate-700"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 h-10 px-4 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label, variant = "default" }) {
  const variants = {
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    default: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${variants[variant]}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function DetailCard({ icon: Icon, label, value, readOnly = false }) {
  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        readOnly
          ? "bg-gray-50 border-gray-200"
          : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <label className="text-sm font-medium text-gray-600">{label}</label>
      </div>
      <div className="text-base font-normal text-gray-900 ml-11">
        {value ?? "-"}
      </div>
    </div>
  );
}

function EditableField({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <div className="p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-300 transition-all">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <label className="text-sm font-medium text-gray-600">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ml-11 mt-1"
        required={required}
      />
    </div>
  );
}
