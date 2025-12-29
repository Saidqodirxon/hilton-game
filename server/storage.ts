import {
  GameScoreModel,
  type InsertGameScore,
  type GameScore,
} from "@shared/schema";

export interface IStorage {
  createScore(score: InsertGameScore): Promise<GameScore>;
  getTopScores(limit?: number): Promise<GameScore[]>;
}

export class DatabaseStorage implements IStorage {
  async createScore(insertScore: InsertGameScore): Promise<GameScore> {
    const score = await GameScoreModel.create(insertScore);
    return {
      id: score._id.toString(),
      playerName: score.playerName,
      score: score.score,
      discountEarned: score.discountEarned,
      partsStacked: score.partsStacked,
      createdAt: score.createdAt,
    };
  }

  async getTopScores(limit = 10): Promise<GameScore[]> {
    const scores = await GameScoreModel.find()
      .sort({ score: -1 })
      .limit(limit)
      .lean();

    return scores.map((score) => ({
      id: score._id.toString(),
      playerName: score.playerName,
      score: score.score,
      discountEarned: score.discountEarned,
      partsStacked: score.partsStacked,
      createdAt: score.createdAt,
    }));
  }
}

export const storage = new DatabaseStorage();
