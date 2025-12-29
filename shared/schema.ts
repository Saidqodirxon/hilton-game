import mongoose, { Schema, Document } from "mongoose";
import { insertGameScoreSchema, GameSettingsSchema } from "./types";

// Re-export types for backward compatibility
export * from "./types";

// === MONGOOSE SCHEMA (server-only) ===
export interface IGameScore extends Document {
  playerName: string;
  score: number;
  discountEarned: number;
  partsStacked: number;
  createdAt: Date;
}

const gameScoreSchema = new Schema<IGameScore>({
  playerName: {
    type: String,
    required: true,
    default: "Guest",
  },
  score: {
    type: Number,
    required: true,
  },
  discountEarned: {
    type: Number,
    required: true,
  },
  partsStacked: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const GameScoreModel = mongoose.model<IGameScore>(
  "GameScore",
  gameScoreSchema
);
