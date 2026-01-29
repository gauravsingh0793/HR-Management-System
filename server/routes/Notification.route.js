import express from "express"
import { HandleEmployeeNotificationCounts, HandleHRNotificationCounts, HandleHRMarkAsViewed, HandleEmployeeMarkAsViewed } from "../controllers/Notification.controller.js"
import { VerifyEmployeeToken } from "../middlewares/Auth.middleware.js"
import { VerifyhHRToken } from "../middlewares/Auth.middleware.js"

const notificationrouter = express.Router()

notificationrouter.get("/hr/counts", VerifyhHRToken, HandleHRNotificationCounts)
notificationrouter.post("/hr/mark-viewed", VerifyhHRToken, HandleHRMarkAsViewed)
notificationrouter.get("/employee/counts", VerifyEmployeeToken, HandleEmployeeNotificationCounts)
notificationrouter.post("/employee/mark-viewed", VerifyEmployeeToken, HandleEmployeeMarkAsViewed)

export default notificationrouter
