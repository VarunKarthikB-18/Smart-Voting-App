import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  hasVoted: boolean("has_voted").default(false).notNull(),
  votedFor: integer("voted_for").references(() => candidates.id),
  faceData: jsonb("face_data"),
  faceRegistered: boolean("face_registered").default(false).notNull(),
  role: text("role").default("voter").notNull(), // "voter" or "admin"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  party: text("party").notNull(),
  slogan: text("slogan").notNull(),
  avatarUrl: text("avatar_url").notNull(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull()
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
