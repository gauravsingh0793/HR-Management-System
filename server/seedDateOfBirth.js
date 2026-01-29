import mongoose from "mongoose";
import { Employee } from "./models/Employee.model.js";
import dotenv from "dotenv";

dotenv.config();

const seedDateOfBirth = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get all employees
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees`);

    // Generate random dates in January 2026
    const updates = employees.map((employee) => {
      // Random day between 1 and 31
      const randomDay = Math.floor(Math.random() * 31) + 1;
      const dateOfBirth = new Date(2026, 0, randomDay); // Month 0 = January

      return {
        updateOne: {
          filter: { _id: employee._id },
          update: { $set: { dateOfBirth } },
        },
      };
    });

    // Bulk update all employees
    if (updates.length > 0) {
      const result = await Employee.bulkWrite(updates);
      console.log(
        `Updated ${result.modifiedCount} employees with random dates of birth in January 2026`
      );
    }

    // Verify the updates
    const updatedEmployees = await Employee.find({}).select(
      "firstname lastname dateOfBirth"
    );
    console.log("\nSample of updated employees:");
    updatedEmployees.slice(0, 5).forEach((emp) => {
      console.log(
        `${emp.firstname} ${
          emp.lastname
        }: ${emp.dateOfBirth?.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`
      );
    });

    console.log("\n✅ Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding dates of birth:", error);
    process.exit(1);
  }
};

seedDateOfBirth();
