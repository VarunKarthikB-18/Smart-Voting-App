import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { resolve } from "path";

// Create a new SQLite database
const db = new Database("sqlite.db");

try {
  // Read and execute the migration
  console.log('Running database migrations...');
  const migration = readFileSync(resolve(process.cwd(), 'migrations/0000_initial.sql'), 'utf8');
  db.exec(migration);
  console.log('Migrations completed successfully');

  // Close the database connection
  db.close();
  
  console.log('Database initialization completed successfully');
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
} 