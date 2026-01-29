import {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
} from "./emailtemplates.js";
import { Emailclient, sender } from "./mailtrap.config.js";

export const SendVerificationEmail = async (email, verificationcode) => {
  const receiver = [{ email }];
  try {
    const response = await Emailclient.send({
      from: sender,
      to: receiver,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationcode
      ),
      category: "Email verification",
    });
    // console.log("Verification email sent successfully", response)
    return response.success;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

export const SendWelcomeEmail = async (email, firstname, lastname, role) => {
  const receiver = [{ email }];
  const displayName =
    role === "HR-Admin"
      ? `${firstname} ${lastname} - HR`
      : `${firstname} ${lastname}`;

  const companyName = sender.name || "Employee Management System";

  const html = `
      <h2>Welcome to ${companyName}</h2>
      <p>Hi ${displayName},</p>
      <p>Your account has been created successfully.</p>
      <p>We're glad to have you on board.</p>
    `;

  try {
    const response = await Emailclient.send({
      from: sender,
      to: receiver,
      subject: "Welcome to " + companyName,
      html,
    });
    return response.success;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

export const SendForgotPasswordEmail = async (email, resetURL) => {
  const receiver = [{ email }];
  try {
    const response = await Emailclient.send({
      from: sender,
      to: receiver,
      subject: "Reset Your Password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
      category: "Password Reset Email",
    });
    // console.log("Forgot Password email sent successfully", response)
    return response.success;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

export const SendResetPasswordConfimation = async (email) => {
  const receiver = [{ email }];
  try {
    const response = await Emailclient.send({
      from: sender,
      to: receiver,
      subject: "Password Reset Successfully",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset Confirmation",
    });
    // console.log("Reset Password confirmation email sent successfully", response)
    return response.success;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

export const sendInterviewScheduleEmail = async (
  applicantEmail,
  applicantName,
  interviewerName,
  interviewDate
) => {
  console.log("=== Sending Interview Email (Gmail SMTP) ===");
  console.log("To:", applicantEmail);
  console.log("Name:", applicantName);
  console.log("Interviewer:", interviewerName);
  console.log("Date:", interviewDate);
  console.log("Sender Email:", sender.email);

  try {
    const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Interview Scheduled</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${applicantName},</p>
                        <p>We are pleased to inform you that an interview has been scheduled with our team.</p>
                        <h3>Interview Details:</h3>
                        <ul>
                            <li><strong>Interviewer:</strong> ${interviewerName}</li>
                            <li><strong>Date & Time:</strong> ${interviewDate}</li>
                        </ul>
                        <p>Please make sure to be available at the scheduled time. If you have any questions or need to reschedule, please contact us as soon as possible.</p>
                        <p>We look forward to meeting you!</p>
                        <p>Best regards,<br>HR Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

    const response = await Emailclient.send({
      from: sender,
      to: [{ email: applicantEmail, name: applicantName }],
      subject: "Interview Scheduled - Important",
      html: emailHtml,
    });

    console.log("✅ Email sent successfully via Gmail SMTP");
    console.log(
      "Response:",
      JSON.stringify(response.info || response, null, 2)
    );
    return true;
  } catch (error) {
    console.error("❌ Error sending interview email:");
    console.error("Error message:", error.message);
    return false;
  }
};
