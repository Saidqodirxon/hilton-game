import { z } from "zod";

// === ZOD SCHEMAS (client-safe, no mongoose) ===
export const insertGameScoreSchema = z.object({
  playerName: z.string().default("Guest"),
  score: z.number(),
  discountEarned: z.number(),
  partsStacked: z.number(),
});

export const GameSettingsSchema = z.object({
  totalParts: z.number().default(6),
  maxDiscount: z.number().default(50),
  moveSpeed: z.number().default(5),
  tolerance: z.number().default(10),
  enableKeyboard: z.boolean().default(false),
  enableGestures: z.boolean().default(true),
  difficulty: z.enum(["easy", "normal", "hard"]).default("normal"),
});

// === TYPES ===
export type GameScore = {
  id: string;
  playerName: string;
  score: number;
  discountEarned: number;
  partsStacked: number;
  createdAt: Date;
};

export type InsertGameScore = z.infer<typeof insertGameScoreSchema>;
export type CreateScoreRequest = InsertGameScore;
export type ScoreResponse = GameScore;
export type GameSettings = z.infer<typeof GameSettingsSchema>;
