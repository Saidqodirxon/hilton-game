import { db } from "./db";
import {
  gameScores,
  type InsertGameScore,
  type GameScore
} from "@shared/schema";
import { desc } from "drizzle-orm";

export interface IStorage {
  createScore(score: InsertGameScore): Promise<GameScore>;
  getTopScores(limit?: number): Promise<GameScore[]>;
}

export class DatabaseStorage implements IStorage {
  async createScore(insertScore: InsertGameScore): Promise<GameScore> {
    const [score] = await db.insert(gameScores).values(insertScore).returning();
    return score;
  }

  async getTopScores(limit = 10): Promise<GameScore[]> {
    return await db
      .select()
      .from(gameScores)
      .orderBy(desc(gameScores.score))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
