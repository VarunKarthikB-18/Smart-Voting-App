import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { users, candidates, votes, sessions } from "@shared/schema";

// Create a database connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema: { users, candidates, votes, sessions } });

// Initialize the database with default candidates if needed
export async function initializeDatabase() {
  try {
    // Check if we have candidates
    const existingCandidates = await db.select().from(candidates);
    
    // If no candidates exist, create default ones
    if (existingCandidates.length === 0) {
      console.log('No candidates found, initializing with defaults...');
      const defaultCandidates = [
        {
          name: "John Smith",
          party: "Progressive Party",
          slogan: "Building a Better Tomorrow",
          avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg"
        },
        {
          name: "Sarah Johnson",
          party: "Liberty Alliance",
          slogan: "Freedom and Prosperity for All",
          avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
        },
        {
          name: "Michael Rodriguez",
          party: "Unity Coalition",
          slogan: "Together We Achieve More",
          avatarUrl: "https://randomuser.me/api/portraits/men/67.jpg"
        },
        {
          name: "Emily Williams",
          party: "Reform Movement",
          slogan: "Real Change, Real Results",
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