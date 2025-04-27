import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

const scryptAsync = promisify(scrypt);

// Hash password using scrypt and a random salt
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Initialize the admin user
export async function initializeAdmin() {
  try {
    console.log("Checking for admin user...");
    // Check if admin user exists
    const adminUser = db.select().from(users).where(eq(users.username, "admin")).all();
    
    // If no admin exists, create one
    if (adminUser.length === 0) {
      console.log('No admin user found, creating default admin...');
      
      // Create admin user with hashed password
      const hashedPassword = await hashPassword("password123");
      
      // Insert admin user directly into the database
      db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        name: "Administrator",
        email: "admin@votingsystem.com",
        role: "admin",
        hasVoted: 0,
        faceRegistered: 0,
      }).run();
      
      console.log('Default admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing admin user:', error);
    throw error;
  }
}