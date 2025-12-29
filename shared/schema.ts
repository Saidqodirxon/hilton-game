import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull().default("Guest"),
  score: integer("score").notNull(), // Percentage 0-100 or raw score
  discountEarned: integer("discount_earned").notNull(), // 0-50
  partsStacked: integer("parts_stacked").notNull(), // 0-6
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertGameScoreSchema = createInsertSchema(gameScores).omit({ id: true, createdAt: true });

// === TYPES ===
export type GameScore = typeof gameScores.$inferSelect;
export type InsertGameScore = z.infer<typeof insertGameScoreSchema>;

export type CreateScoreRequest = InsertGameScore;
export type ScoreResponse = GameScore;

// === GAME SETTINGS TYPE (Client-side mainly, but defined here for consistency) ===
export const GameSettingsSchema = z.object({
  totalParts: z.number().default(6),
  maxDiscount: z.number().default(50),
  moveSpeed: z.number().default(5), // Speed of the crane
  tolerance: z.number().default(10), // Pixels of tolerance for "perfect" drop
  enableKeyboard: z.boolean().default(false),
  enableGestures: z.boolean().default(true),
  difficulty: z.enum(["easy", "normal", "hard"]).default("normal"),
});

export type GameSettings = z.infer<typeof GameSettingsSchema>;
