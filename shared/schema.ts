import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  hasVoted: integer("has_voted", { mode: "boolean" }).notNull().default(false),
  votedFor: integer("voted_for").references(() => candidates.id),
  faceData: blob("face_data", { mode: "json" }),
  faceRegistered: integer("face_registered", { mode: "boolean" }).notNull().default(false),
  role: text("role").notNull().default("voter"), // "voter" or "admin"
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s', 'now'))`),
});

export const candidates = sqliteTable("candidates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  party: text("party").notNull(),
  slogan: text("slogan").notNull(),
  avatarUrl: text("avatar_url").notNull(),
});

export const votes = sqliteTable("votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  candidateId: integer("candidate_id").references(() => candidates.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  timestamp: integer("timestamp").notNull().default(sql`(strftime('%s', 'now'))`),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s', 'now'))`),
  expiresAt: integer("expires_at").notNull()
});

export const registerUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6)
});

export const loginUserSchema = z.object({
  username: z.string(),
  password: z.string()
});

export const faceDataSchema = z.object({
  userId: z.number(),
  faceData: z.any()
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  username: true,
  password: true,
  role: true,
});

export const insertCandidateSchema = createInsertSchema(candidates);

export const insertVoteSchema = createInsertSchema(votes).pick({
  candidateId: true,
  userId: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  token: true,
  expiresAt: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type VoteResult = {
  candidate: Candidate;
  votes: number;
  percentage: number;
};

export type ElectionSummary = {
  totalVotes: number;
  results: VoteResult[];
  leadingCandidate?: VoteResult;
};
