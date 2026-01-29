import express from "express"
import { HandleTestEmail } from "../controllers/TestEmail.controller.js"

const testEmailRouter = express.Router()

testEmailRouter.post("/test", HandleTestEmail)

export default testEmailRouter
