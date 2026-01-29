import mongoose from 'mongoose';
import { Department } from './models/Department.model.js';
import { Organization } from './models/Organization.model.js';
import dotenv from 'dotenv';

dotenv.config();

const itDepartments = [
    {
        name: "Software Development",
        description: "Responsible for designing, developing, and maintaining software applications and systems"
    },
    {
        name: "DevOps",
        description: "Handles deployment, infrastructure, CI/CD pipelines, and system operations"
    },
    {
        name: "Quality Assurance",
        description: "Ensures software quality through testing, bug tracking, and quality control processes"
    },
    {
        name: "Data Science",
        description: "Analyzes complex data, builds machine learning models, and provides data-driven insights"
    },
    {
        name: "Cybersecurity",
        description: "Protects company systems, networks, and data from security threats and vulnerabilities"
    },
    {
        name: "IT Support",
        description: "Provides technical support and troubleshooting for hardware, software, and network issues"
    },
    {
        name: "Cloud Engineering",
        description: "Manages cloud infrastructure, migration, and optimization on platforms like AWS, Azure, GCP"
    },
    {
        name: "UI/UX Design",
        description: "Creates user interfaces and experiences for web and mobile applications"
    },
    {
        name: "Network Administration",
        description: "Maintains and manages network infrastructure, routers, switches, and connectivity"
    },
    {
        name: "Database Administration",
        description: "Manages database systems, ensures data integrity, performance, and backup procedures"
    }
];

const seedDepartments = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the first organization (you can modify this to get a specific organization)
        const organization = await Organization.findOne();
        
        if (!organization) {
            console.log('No organization found. Please create an organization first.');
            process.exit(1);
        }

        console.log(`Using organization: ${organization.name || organization._id}`);

        // Check existing departments to avoid duplicates
        const existingDepartments = await Department.find({ 
            organizationID: organization._id 
        });

        console.log(`Found ${existingDepartments.length} existing departments`);

        // Add departments
        let addedCount = 0;
        for (const dept of itDepartments) {
            const exists = existingDepartments.find(
                d => d.name.toLowerCase() === dept.name.toLowerCase()
            );

            if (!exists) {
                await Department.create({
                    name: dept.name,
                    description: dept.description,
                    organizationID: organization._id,
                    employees: [],
                    notice: []
                });
                console.log(`✓ Added: ${dept.name}`);
                addedCount++;
            } else {
                console.log(`- Skipped: ${dept.name} (already exists)`);
            }
        }

        console.log(`\nSuccessfully added ${addedCount} new departments`);
        console.log('Seeding completed!');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding departments:', error);
        process.exit(1);
    }
};

seedDepartments();
