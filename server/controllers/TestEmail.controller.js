import { sendInterviewScheduleEmail } from "../mailtrap/emails.js"

export const HandleTestEmail = async (req, res) => {
    try {
        const { email } = req.body
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: "Email is required" 
            })
        }

        console.log("\n========================================")
        console.log("TESTING EMAIL FUNCTIONALITY")
        console.log("Target Email:", email)
        console.log("========================================\n")

        const result = await sendInterviewScheduleEmail(
            email,
            "Test Applicant",
            "Test Interviewer",
            new Date().toLocaleString()
        )

        if (result) {
            return res.status(200).json({ 
                success: true, 
                message: "Test email sent successfully! Check the console logs for details.",
                emailSent: true
            })
        } else {
            return res.status(500).json({ 
                success: false, 
                message: "Failed to send test email. Check the server console for error details.",
                emailSent: false
            })
        }

    } catch (error) {
        console.error("Test Email Error:", error)
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error", 
            error: error.message 
        })
    }
}
