import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { users, candidates, votes, sessions } from "@shared/schema";

// Create a database connection
const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema: { users, candidates, votes, sessions } });

// Initialize the database with default candidates
export async function initializeDatabase() {
  try {
    // Check if we have candidates
    const existingCandidates = await db.select().from(candidates);
    
    // If no candidates exist, create default ones
    if (existingCandidates.length === 0) {
      console.log('No candidates found, initializing with defaults...');
      const defaultCandidates = [
        {
          name: "Rajesh Sharma",
          party: "Bharatiya Janata Party",
          slogan: "Building a Stronger India",
          avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg"
        },
        {
          name: "Priya Patel",
          party: "Indian National Congress",
          slogan: "Unity in Diversity",
          avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
        },
        {
          name: "Vikram Singh",
          party: "Aam Aadmi Party",
          slogan: "For the Common Man",
          avatarUrl: "https://randomuser.me/api/portraits/men/67.jpg"
        },
        {
          name: "Ananya Desai",
          party: "Bahujan Samaj Party",
          slogan: "Social Justice for All",
          avatarUrl: "https://randomuser.me/api/portraits/women/29.jpg"
        },
      ];
      
      await db.insert(candidates).values(defaultCandidates);
      console.log('Default candidates created successfully');
    } else {
      console.log(`Found ${existingCandidates.length} existing candidates`);
    }

    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}