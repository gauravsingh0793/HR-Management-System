import { Department } from "../models/Department.model.js";
import { HumanResources } from "../models/HR.model.js";
import { Organization } from "../models/Organization.model.js";
import { uploadImage } from "../utils/cloudinary.js";

export const HandleAllHR = async (req, res) => {
  try {
    const HR = await HumanResources.find({
      organizationID: req.ORGID,
    }).populate("department");
    return res
      .status(200)
      .json({
        success: true,
        message: "All Human Resources Found Successfully",
        data: HR,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

export const HandleHR = async (req, res) => {
  try {
    const { HRID } = req.params;
    const HR = await HumanResources.findOne({
      _id: HRID,
      organizationID: req.ORGID,
    });

    if (!HR) {
      return res
        .status(404)
        .json({ success: false, message: "HR Record Not Found" });
    }

    return res.status(200).json({
      success: true,
      message: "Human Resources Found Successfully",
      data: {
        FirstName: HR.firstname,
        LastName: HR.lastlogin,
        Email: HR.email,
        PhoneNo: HR.PhoneNo,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

export const HandleUpdateHR = async (req, res) => {
  try {
    const { HRID, Updatedata } = req.body;

    if (!HRID || !Updatedata) {
      return res
        .status(400)
        .json({ success: false, message: "Missing HRID or Updatedata" });
    }

    const payload = { ...Updatedata };

    if (payload.profileimage && !payload.profileimage.startsWith("http")) {
      try {
        console.log("Attempting to upload HR profile image...");
        const url = await uploadImage(
          payload.profileimage,
          "hr-nexus/profiles"
        );
        if (url) {
          payload.profileimage = url;
          console.log("HR profile image uploaded successfully:", url);
        } else {
          console.error("Image upload returned no URL");
          return res
            .status(400)
            .json({ success: false, message: "Image upload returned no URL" });
        }
      } catch (err) {
        console.error("HR Image upload error:", err);
        return res
          .status(400)
          .json({
            success: false,
            message: "Image upload failed",
            error: err?.message || String(err),
          });
      }
    }

    const updatedHR = await HumanResources.findByIdAndUpdate(HRID, payload, {
      new: true,
    });

    if (!updatedHR) {
      return res
        .status(404)
        .json({ success: false, message: "HR Record Not Found" });
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Human Resources Updated Successfully",
        data: updatedHR,
      });
  } catch (error) {
    console.error("HandleUpdateHR error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "internal Server Error",
        error: error?.message || String(error),
      });
  }
};

export const HandleDeleteHR = async (req, res) => {
  try {
    const { HRID } = req.params;

    const HR = await HumanResources.findOne({
      _id: HRID,
      organizationID: req.ORGID,
    });

    if (!HR) {
      return res
        .status(404)
        .json({ success: false, message: "HR Record Not Found" });
    }

    if (HR.department) {
      const department = await Department.findById(HR.department);

      if (department && department.HumanResources.includes(HRID)) {
        const index = department.HumanResources.indexOf(HRID);
        department.HumanResources.splice(index, 1);
      }

      await department.save();
    }

    const organization = await Organization.findById(req.ORGID);
    organization.HRs.splice(organization.HRs.indexOf(HRID), 1);

    await organization.save();
    await HR.deleteOne();

    return res
      .status(200)
      .json({ success: true, message: "Human Resources Deleted Successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};
