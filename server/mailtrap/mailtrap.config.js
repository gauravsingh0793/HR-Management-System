import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

console.log("=== Gmail SMTP Email Configuration ===");
console.log("GMAIL_USER:", process.env.GMAIL_USER);
console.log("COMPANY_NAME:", process.env.COMPANY_NAME);
console.log("======================================\n");

// Default sender details used across emails
export const sender = {
  email:
    process.env.GMAIL_USER ||
    process.env.SENDER_EMAIL ||
    "gauravsingh30062003@gmail.com",
  name: process.env.COMPANY_NAME || "Employee Management System",
};

// Create Nodemailer transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Simple client with a `send` method compatible with existing usage
export const Emailclient = {
  /**
   * Send an email using Gmail SMTP
   * @param {Object} options
   * @param {{email:string,name:string}} options.from
   * @param {Array<{email:string,name?:string}>} options.to
   * @param {string} options.subject
   * @param {string} options.html
   */
  send: async ({ from, to, subject, html } = {}) => {
    const mailOptions = {
      from: `"${from?.name || sender.name}" <${from?.email || sender.email}>`,
      to: Array.isArray(to)
        ? to
            .map((r) => r.email)
            .filter(Boolean)
            .join(",")
        : undefined,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      info,
    };
  },
};
