import { Notice } from "../models/Notice.model.js"
import { Leave } from "../models/Leave.model.js"
import { GenerateRequest } from "../models/GenerateRequest.model.js"
import { Employee } from "../models/Employee.model.js"
import { NotificationView } from "../models/NotificationView.model.js"

// Get notification counts for HR
export const HandleHRNotificationCounts = async (req, res) => {
    try {
        const hrId = req.HRid
        
        // Get last viewed timestamps
        const viewRecord = await NotificationView.findOne({ 
            userId: hrId, 
            userType: "HR",
            organizationID: req.ORGID
        })
        
        const lastViewedLeaves = viewRecord?.lastViewedLeaves || new Date(0)
        const lastViewedRequests = viewRecord?.lastViewedRequests || new Date(0)
        const lastViewedNotices = viewRecord?.lastViewedNotices || new Date(0)
        
        const pendingLeaves = await Leave.countDocuments({ 
            organizationID: req.ORGID, 
            status: "Pending",
            createdAt: { $gt: lastViewedLeaves }
        })
        
        const pendingRequests = await GenerateRequest.countDocuments({ 
            organizationID: req.ORGID, 
            status: "Pending",
            createdAt: { $gt: lastViewedRequests }
        })
        
        const newNotices = await Notice.countDocuments({ 
            organizationID: req.ORGID,
            createdAt: { $gt: lastViewedNotices }
        })

        return res.status(200).json({ 
            success: true, 
            data: { 
                leaves: pendingLeaves,
                requests: pendingRequests,
                notices: newNotices
            } 
        })
    }
    catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error, 
            message: "Internal server error" 
        })
    }
}

// Get notification counts for Employee
export const HandleEmployeeNotificationCounts = async (req, res) => {
    try {
        const employeeId = req.EMid
        
        // Get employee to check department
        const employee = await Employee.findById(employeeId).select("department")
        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                message: "Employee not found" 
            })
        }

        // Get last viewed timestamps
        const viewRecord = await NotificationView.findOne({ 
            userId: employeeId, 
            userType: "Employee",
            organizationID: req.ORGID
        })
        
        const lastViewedLeaves = viewRecord?.lastViewedLeaves || new Date(0)
        const lastViewedRequests = viewRecord?.lastViewedRequests || new Date(0)
        const lastViewedNotices = viewRecord?.lastViewedNotices || new Date(0)

        // Get employee's leave requests status updates
        const leaveUpdates = await Leave.countDocuments({ 
            employee: employeeId,
            organizationID: req.ORGID,
            status: { $in: ["Approved", "Rejected"] },
            updatedAt: { $gt: lastViewedLeaves }
        })
        
        // Get employee's request updates
        const requestUpdates = await GenerateRequest.countDocuments({ 
            employee: employeeId,
            organizationID: req.ORGID,
            status: { $in: ["Approved", "Rejected"] },
            updatedAt: { $gt: lastViewedRequests }
        })
        
        // Get new notices
        const newNotices = await Notice.countDocuments({
            organizationID: req.ORGID,
            $or: [
                { department: employee.department },
                { employee: employeeId }
            ],
            createdAt: { $gt: lastViewedNotices }
        })

        return res.status(200).json({ 
            success: true, 
            data: { 
                leaves: leaveUpdates,
                requests: requestUpdates,
                notices: newNotices
            } 
        })
    }
    catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error, 
            message: "Internal server error" 
        })
    }
}

// Mark section as viewed for HR
export const HandleHRMarkAsViewed = async (req, res) => {
    try {
        const hrId = req.HRid
        const { section } = req.body // "notices", "leaves", or "requests"
        
        if (!["notices", "leaves", "requests"].includes(section)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid section" 
            })
        }
        
        const updateField = `lastViewed${section.charAt(0).toUpperCase() + section.slice(1)}`
        
        await NotificationView.findOneAndUpdate(
            { userId: hrId, userType: "HR", organizationID: req.ORGID },
            { [updateField]: new Date() },
            { upsert: true, new: true }
        )

        return res.status(200).json({ 
            success: true, 
            message: "Marked as viewed" 
        })
    }
    catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error, 
            message: "Internal server error" 
        })
    }
}

// Mark section as viewed for Employee
export const HandleEmployeeMarkAsViewed = async (req, res) => {
    try {
        const employeeId = req.EMid
        const { section } = req.body // "notices", "leaves", or "requests"
        
        if (!["notices", "leaves", "requests"].includes(section)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid section" 
            })
        }
        
        const updateField = `lastViewed${section.charAt(0).toUpperCase() + section.slice(1)}`
        
        await NotificationView.findOneAndUpdate(
            { userId: employeeId, userType: "Employee", organizationID: req.ORGID },
            { [updateField]: new Date() },
            { upsert: true, new: true }
        )

        return res.status(200).json({ 
            success: true, 
            message: "Marked as viewed" 
        })
    }
    catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error, 
            message: "Internal server error" 
        })
    }
}
