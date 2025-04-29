import { db } from "../server/db";
import { users, insertUserSchema } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
    // Check if admin exists
    const adminUser = db.select().from(users).where(eq(users.username, 'admin')).get();
    
    if (!adminUser) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const userData = insertUserSchema.parse({
        name: 'Admin User',
        email: 'admin@example.com',
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        faceRegistered: true // Admin doesn't need face registration
      });
      
      const result = db.insert(users).values(userData).run();
      
      console.log('Admin user created successfully');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser(); 