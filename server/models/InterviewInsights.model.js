import mongoose from 'mongoose'
import { Schema } from "mongoose";


const InterviewinsightSchema = new Schema({
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Applicant"
    },
    applicantName: {
        type: String,
    },
    applicantEmail: {
        type: String,
    },
    feedback: {
        type: String,
    },
    interviewer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Employee"
    },
    interviewdate: {
        type: Date,
    },
    responsedate: {
        type: Date,
    },
    status: {
        type: String,
        required: true,
        enum: ["Pending", "Canceled", "Completed"],
        default: "Pending"
    },
    organizationID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization"
    }
}, { timestamps: true });

export const Interviewinsight = mongoose.model("Interviewinsight", InterviewinsightSchema)