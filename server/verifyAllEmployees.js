import mongoose from "mongoose";
import { Employee } from "./models/Employee.model.js";
import dotenv from "dotenv";

dotenv.config();

const verifyAllEmployees = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Update all employees to verified status
    const result = await Employee.updateMany(
      { isverified: { $ne: true } }, // Only update those not verified
      { $set: { isverified: true } }
    );

    console.log(
      `✅ Updated ${result.modifiedCount} employees to verified status`
    );

    // Get count of all verified employees
    const verifiedCount = await Employee.countDocuments({ isverified: true });
    const totalCount = await Employee.countDocuments({});

    console.log(
      `\n📊 Status: ${verifiedCount}/${totalCount} employees are now verified`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error verifying employees:", error);
    process.exit(1);
  }
};

verifyAllEmployees();
