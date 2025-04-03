import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  hasVoted: boolean("has_voted").default(false).notNull(),
  votedFor: integer("voted_for").references(() => candidates.id),
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
  timestamp: text("timestamp").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCandidateSchema = createInsertSchema(candidates);

export const insertVoteSchema = createInsertSchema(votes).pick({
  candidateId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

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
