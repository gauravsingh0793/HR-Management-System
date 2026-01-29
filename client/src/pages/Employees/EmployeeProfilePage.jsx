import { useCallback, useEffect, useState, useMemo } from "react";
import { apiService } from "@/redux/apis/APIService";
import { EmployeeProfileEndPoints } from "@/redux/apis/APIsEndpoints";
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
  Loader2,
  Upload,
} from "lucide-react";

export const EmployeeProfilePage = () => {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [profileForm, setProfileForm] = useState({
    firstname: "",
    lastname: "",
    contactnumber: "",
    dateOfBirth: "",
  });

  const initials = useMemo(() => {
    const first =
      profileForm.firstname?.charAt(0)?.toUpperCase() ||
      me?.firstname?.charAt(0)?.toUpperCase() ||
      "E";
    const last =
      profileForm.lastname?.charAt(0)?.toUpperCase() ||
      me?.lastname?.charAt(0)?.toUpperCase() ||
      "M";
    return `${first}${last}`;
  }, [profileForm.firstname, profileForm.lastname, me]);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await apiService.get(EmployeeProfileEndPoints.GET, {
        withCredentials: true,
      });
      const data = res.data?.data;
      if (data) {
        setMe(data);
        setAvatarPreview(data.profileimage || "");
        setProfileForm({
          firstname: data.firstname || "",
          lastname: data.lastname || "",
          contactnumber: data.contactnumber || "",
          dateOfBirth: data.dateOfBirth
            ? new Date(data.dateOfBirth).toISOString().split("T")[0]
            : "",
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

  const saveProfile = useCallback(async () => {
    if (!me?._id) return;
    setProfileSaving(true);
    try {
      // Compress image if present
      const compressImage = (dataUri) => {
        return new Promise((resolve, reject) => {
          if (!dataUri) return resolve(null);
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

      const updatedEmployee = {
        firstname: profileForm.firstname,
        lastname: profileForm.lastname,
        contactnumber: profileForm.contactnumber,
        dateOfBirth: profileForm.dateOfBirth,
      };

      console.log("avatarPreview:", avatarPreview);
      console.log(
        "avatarPreview starts with http?",
        avatarPreview?.startsWith("http"),
      );
      console.log("me.profileimage:", me?.profileimage);

      // Only include image if it changed and is not the existing image URL
      if (avatarPreview && !avatarPreview.startsWith("http")) {
        console.log("Compressing image for upload...");
        const compressed = await compressImage(avatarPreview);
        console.log("Compressed image length:", compressed?.length);
        if (compressed) {
          updatedEmployee.profileimage = compressed;
          console.log("Added profileimage to updatedEmployee");
        }
      }

      console.log("Sending to backend - updatedEmployee:", updatedEmployee);
      console.log("Has profileimage?", !!updatedEmployee.profileimage);

      const res = await apiService.patch(
        EmployeeProfileEndPoints.UPDATE,
        {
          employeeId: me._id,
          updatedEmployee,
        },
        { withCredentials: true },
      );
      const updated = res.data?.data;
      console.log("Employee profile - update response:", updated);
      console.log(
        "Employee profile - profileimage from response:",
        updated?.profileimage,
      );
      if (updated) {
        setMe(updated);
        setAvatarPreview(updated.profileimage || "");
        setProfileForm({
          firstname: updated.firstname || "",
          lastname: updated.lastname || "",
          contactnumber: updated.contactnumber || "",
          dateOfBirth: updated.dateOfBirth
            ? new Date(updated.dateOfBirth).toISOString().split("T")[0]
            : "",
        });
      }
      setProfileEditing(false);
      toast({
        title: "Profile updated successfully!",
        description: "Your changes have been saved.",
      });
      // Trigger sidebar refresh
      console.log("Employee profile - dispatching profileUpdated event");
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (error) {
      toast({
        title: "Update failed",
        description: error?.response?.data?.message || error.message,
        variant: "destructive",
      });
      console.error("Update failed", error);
      console.error("Error details:", {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      });
    } finally {
      setProfileSaving(false);
    }
  }, [me, profileForm, avatarPreview, toast]);

  const handleAvatar = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loadingProfile && !me) {
    return (
      <div className="w-full mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-6 animate-fade-in-up">
      {/* Profile Header Card */}
      <Card className="frosted-card border-transparent shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Avatar */}
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover shadow-lg ring-4 ring-blue-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-blue-100">
                  {initials}
                </div>
              )}
              {profileEditing && (
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

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {me ? `${me.firstname} ${me.lastname}` : "Loading..."}
              </h1>
              <p className="text-gray-600 mb-4 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {me?.email || "-"}
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge
                  icon={me?.isverified ? CheckCircle2 : XCircle}
                  label={me?.isverified ? "Verified" : "Not Verified"}
                  variant={me?.isverified ? "success" : "warning"}
                />
                <Badge
                  icon={Building2}
                  label={
                    typeof me?.department === "object"
                      ? me?.department?.name
                      : me?.department || "No Department"
                  }
                  variant="info"
                />
                {me?.status && (
                  <Badge
                    icon={User}
                    label={me?.status}
                    variant={me?.status === "Active" ? "success" : "danger"}
                  />
                )}
              </div>
            </div>

            {/* Edit Button */}
            {me && (
              <Button
                variant={profileEditing ? "outline" : "default"}
                size="lg"
                onClick={() => setProfileEditing((v) => !v)}
                disabled={profileSaving}
                className="flex items-center gap-2"
              >
                {profileEditing ? (
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Card */}
      <Card className="shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {!profileEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailCard
                icon={User}
                label="First Name"
                value={me?.firstname || "-"}
              />
              <DetailCard
                icon={User}
                label="Last Name"
                value={me?.lastname || "-"}
              />
              <DetailCard
                icon={Mail}
                label="Email Address"
                value={me?.email || "-"}
              />
              <DetailCard
                icon={Phone}
                label="Contact Number"
                value={me?.contactnumber || "-"}
              />
              <DetailCard
                icon={Building2}
                label="Department"
                value={
                  typeof me?.department === "object"
                    ? me?.department?.name
                    : me?.department || "-"
                }
              />
              <DetailCard
                icon={User}
                label="Date of Birth"
                value={
                  me?.dateOfBirth
                    ? new Date(me.dateOfBirth).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"
                }
              />
              <DetailCard
                icon={me?.isverified ? CheckCircle2 : XCircle}
                label="Verification Status"
                value={me?.isverified ? "Verified" : "Not Verified"}
              />
            </div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                await saveProfile();
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditableField
                  icon={User}
                  label="First Name"
                  value={profileForm.firstname}
                  onChange={(v) =>
                    setProfileForm((s) => ({ ...s, firstname: v }))
                  }
                  required
                />
                <EditableField
                  icon={User}
                  label="Last Name"
                  value={profileForm.lastname}
                  onChange={(v) =>
                    setProfileForm((s) => ({ ...s, lastname: v }))
                  }
                  required
                />
                <DetailCard
                  icon={Mail}
                  label="Email Address"
                  value={me?.email || "-"}
                  readOnly
                />
                <EditableField
                  icon={Phone}
                  label="Contact Number"
                  value={profileForm.contactnumber}
                  onChange={(v) =>
                    setProfileForm((s) => ({ ...s, contactnumber: v }))
                  }
                  type="tel"
                />
                <EditableField
                  icon={User}
                  label="Date of Birth"
                  value={profileForm.dateOfBirth}
                  onChange={(v) =>
                    setProfileForm((s) => ({ ...s, dateOfBirth: v }))
                  }
                  type="date"
                />
                <DetailCard
                  icon={Building2}
                  label="Department"
                  value={
                    typeof me?.department === "object"
                      ? me?.department?.name
                      : me?.department || "-"
                  }
                  readOnly
                />
                <DetailCard
                  icon={me?.isverified ? CheckCircle2 : XCircle}
                  label="Verification Status"
                  value={me?.isverified ? "Verified" : "Not Verified"}
                  readOnly
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setProfileEditing(false);
                    setProfileForm({
                      firstname: me?.firstname || "",
                      lastname: me?.lastname || "",
                      contactnumber: me?.contactnumber || "",
                    });
                  }}
                  disabled={profileSaving}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={profileSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {profileSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function Badge({ icon: Icon, label, variant = "default" }) {
  const variants = {
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    danger: "bg-red-100 text-red-800 border-red-200",
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
      <div className="text-lg font-semibold text-gray-900 ml-11">
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
