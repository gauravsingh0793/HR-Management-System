import { HumanResources } from "../models/HR.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { GenerateJwtTokenAndSetCookiesHR } from "../utils/generatejwttokenandsetcookies.js";
import {
  SendVerificationEmail,
  SendWelcomeEmail,
  SendForgotPasswordEmail,
  SendResetPasswordConfimation,
} from "../mailtrap/emails.js";
import { GenerateVerificationToken } from "../utils/generateverificationtoken.js";
import { Organization } from "../models/Organization.model.js";

export const HandleHRSignup = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      password,
      contactnumber,
      name,
      description,
      OrganizationURL,
      OrganizationMail,
    } = req.body;

    // Check for required HR fields
    if (!firstname || !lastname || !email || !password || !contactnumber) {
      throw new Error("All HR fields are required");
    }

    // Check for required Organization fields
    if (!name || !description || !OrganizationURL || !OrganizationMail) {
      throw new Error("All Organization fields are required");
    }

    const HR = await HumanResources.findOne({ email: email });

    if (HR) {
      return res.status(400).json({
        success: false,
        message:
          "HR already exists, please go to the login page or create new HR",
        type: "signup",
      });
    }

    // Try to find existing organization with matching credentials
    const organization = await Organization.findOne({
      name: name,
      OrganizationURL: OrganizationURL,
      OrganizationMail: OrganizationMail,
    });

    let targetOrganization;
    let message;

    if (organization) {
      // Join existing organization
      targetOrganization = organization;
      message = "HR Registered Successfully and joined existing organization";
    } else {
      // Create new organization
      targetOrganization = await Organization.create({
        name: name,
        description: description,
        OrganizationURL: OrganizationURL,
        OrganizationMail: OrganizationMail,
      });
      message =
        "Organization Created Successfully & HR Registered Successfully";
    }

    const hashedpassword = await bcrypt.hash(password, 10);
    const verificationcode = GenerateVerificationToken(6);

    const newHR = await HumanResources.create({
      firstname,
      lastname,
      email,
      password: hashedpassword,
      contactnumber,
      role: "HR-Admin",
      organizationID: targetOrganization._id,
      verificationtoken: verificationcode,
      verificationtokenexpires: Date.now() + 5 * 60 * 1000,
    });

    targetOrganization.HRs.push(newHR._id);
    await targetOrganization.save();

    GenerateJwtTokenAndSetCookiesHR(
      res,
      newHR._id,
      newHR.role,
      targetOrganization._id,
    );
    const VerificationEmailStatus = await SendVerificationEmail(
      email,
      verificationcode,
    );
    return res.status(201).json({
      success: true,
      message: message,
      VerificationEmailStatus: VerificationEmailStatus,
      type: "signup",
      HRid: newHR._id,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message, type: "signup" });
  }
};

export const HandleHRVerifyEmail = async (req, res) => {
  const { verificationcode } = req.body;
  try {
    // Do not rely on req.ORGID to allow verification without auth
    const HR = await HumanResources.findOne({
      verificationtoken: verificationcode,
      verificationtokenexpires: { $gt: Date.now() },
    });

    if (!HR) {
      return res.status(401).json({
        success: false,
        message: "Invalid or Expired Verifiation Code",
        type: "HRverifyemail",
      });
    }

    HR.isverified = true;
    HR.verificationtoken = undefined;
    HR.verificationtokenexpires = undefined;
    await HR.save();

    const SendWelcomeEmailStatus = await SendWelcomeEmail(
      HR.email,
      HR.firstname,
      HR.lastname,
      HR.role,
    );
    return res.status(200).json({
      success: true,
      message: "Email Verified successfully",
      SendWelcomeEmailStatus: SendWelcomeEmailStatus,
      type: "HRverifyemail",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message, type: "HRverifyemail" });
  }
};

export const HandleHRLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const HR = await HumanResources.findOne({ email: email });

    if (!HR) {
      return res.status(400).json({
        success: false,
        message: "Invaild Credentials, Please Add Correct One",
        type: "HRLogin",
      });
    }

    const isMatch = await bcrypt.compare(password, HR.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invaild Credentials, Please Add Correct One",
        type: "HRLogin",
      });
    }

    GenerateJwtTokenAndSetCookiesHR(res, HR._id, HR.role, HR.organizationID);
    HR.lastlogin = new Date();
    await HR.save();
    return res.status(200).json({
      success: true,
      message: "HR Login Successfull",
      type: "HRLogin",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
      type: "HRLogin",
    });
  }
};

export const HandleHRLogout = async (req, res) => {
  try {
    res.clearCookie("HRtoken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    return res
      .status(200)
      .json({ success: true, message: "HR Logged Out Successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server Error", error: error });
  }
};

export const HandleHRCheck = async (req, res) => {
  try {
    const HR = await HumanResources.findOne({
      _id: req.HRid,
      organizationID: req.ORGID,
    });
    if (!HR) {
      return res
        .status(404)
        .json({ success: false, message: "HR not found", type: "checkHR" });
    }
    return res.status(200).json({
      success: true,
      message: "HR Already Logged In",
      type: "checkHR",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error,
      message: "internal error",
      type: "checkHR",
    });
  }
};

export const HandleHRForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // Allow resend by email only (no auth required)
    const HR = await HumanResources.findOne({
      email: email,
    });

    if (!HR) {
      return res.status(404).json({
        success: false,
        message: "HR Email Does Not Exist Please Enter Correct One",
        type: "HRforgotpassword",
      });
    }

    const resetToken = crypto.randomBytes(25).toString("hex");
    const resetTokenExpires = Date.now() + 1000 * 60 * 60; // 1 hour

    HR.resetpasswordtoken = resetToken;
    HR.resetpasswordexpires = resetTokenExpires;
    await HR.save();

    const URL = `${process.env.CLIENT_URL}/auth/HR/resetpassword/${resetToken}`;
    const SendResetPasswordEmailStatus = await SendForgotPasswordEmail(
      email,
      URL,
    );
    return res.status(200).json({
      success: true,
      message: "Reset Password Email Sent Successfully",
      SendResetPasswordEmailStatus: SendResetPasswordEmailStatus,
      type: "HRforgotpassword",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
      type: "HRforgotpassword",
    });
  }
};

export const HandleHRResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (req.cookies.HRtoken) {
      res.clearCookie("HRtoken");
    }

    const HR = await HumanResources.findOne({
      resetpasswordtoken: token,
      resetpasswordexpires: { $gt: Date.now() },
    });

    if (!HR) {
      return res.status(401).json({
        success: false,
        message: "Invalid or Expired Reset Password Token",
        resetpassword: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    HR.password = hashedPassword;
    HR.resetpasswordtoken = undefined;
    HR.resetpasswordexpires = undefined;
    await HR.save();

    const SendPasswordResetEmailStatus = await SendResetPasswordConfimation(
      HR.email,
    );
    return res.status(200).json({
      success: true,
      message: "Password Reset Successfully",
      SendPasswordResetEmailStatus: SendPasswordResetEmailStatus,
      resetpassword: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
      resetpassword: false,
    });
  }
};

export const HandleHRResetverifyEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const HR = await HumanResources.findOne({
      email: email,
      _id: req.HRid,
      organizationID: req.ORGID,
    });

    if (!HR) {
      return res.status(404).json({
        success: false,
        message: "HR Email Does Not Exist, Please Enter Correct Email",
        type: "HRResendVerifyEmail",
      });
    }

    if (HR.isverified) {
      return res.status(400).json({
        success: false,
        message: "HR Email is already Verified",
        type: "HRResendVerifyEmail",
      });
    }

    const verificationcode = GenerateVerificationToken(6);
    HR.verificationtoken = verificationcode;
    HR.verificationtokenexpires = Date.now() + 5 * 60 * 1000;

    await HR.save();

    const SendVerificationEmailStatus = await SendVerificationEmail(
      email,
      verificationcode,
    );
    return res.status(200).json({
      success: true,
      message: "Verification Email Sent Successfully",
      SendVerificationEmailStatus: SendVerificationEmailStatus,
      type: "HRResendVerifyEmail",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

export const HandleHRcheckVerifyEmail = async (req, res) => {
  try {
    const HR = await HumanResources.findOne({
      _id: req.HRid,
      organizationID: req.ORGID,
    });

    if (HR.isverified) {
      return res.status(200).json({
        sucess: true,
        message: "HR Already Verified",
        type: "HRcodeavailable",
        alreadyverified: true,
      });
    }

    if (HR.verificationtoken && HR.verificationtokenexpires > Date.now()) {
      return res.status(200).json({
        success: true,
        message: "Verification Code is Still Valid",
        type: "HRcodeavailable",
      });
    }

    return res.status(404).json({
      success: false,
      message: "Invalid or Expired Verification Code",
      type: "HRcodeavailable",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
      type: "HRcodeavailable",
    });
  }
};
