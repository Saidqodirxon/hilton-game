import { z } from 'zod';
import { insertGameScoreSchema, gameScores, GameSettingsSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  scores: {
    list: {
      method: 'GET' as const,
      path: '/api/scores',
      responses: {
        200: z.array(z.custom<typeof gameScores.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/scores',
      input: insertGameScoreSchema,
      responses: {
        201: z.custom<typeof gameScores.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
