import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import Database from "better-sqlite3";
import { users, candidates, votes, sessions } from "@shared/schema";
import { readFileSync } from "fs";
import { resolve } from "path";

// Create SQLite database connection
const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite);

// Initialize the database with default candidates
export async function initializeDatabase() {
  try {
    // Run migrations
    console.log('Running database migrations...');
    const migration = readFileSync(resolve(process.cwd(), 'migrations/0000_initial.sql'), 'utf8');
    sqlite.exec(migration);
    console.log('Migrations completed successfully');

    // Check if we have candidates
    const existingCandidates = db.select().from(candidates).all();
    
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
      
      db.insert(candidates).values(defaultCandidates).run();
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