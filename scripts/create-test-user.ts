import { db } from "../server/db";
import { users, insertUserSchema } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from 'bcrypt';

async function createTestUser() {
  try {
    // Check if test user exists
    const testUser = db.select().from(users).where(eq(users.username, 'testuser')).get();
    
    if (!testUser) {
      console.log('Creating test user...');
      const hashedPassword = await bcrypt.hash('test123', 10);
      
      const userData = insertUserSchema.parse({
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
        role: 'voter'
      });
      
      const result = db.insert(users).values(userData).run();
      
      console.log('Test user created successfully');
      console.log('Username: testuser');
      console.log('Password: test123');
    } else {
      console.log('Test user already exists');
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser(); 