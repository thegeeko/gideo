import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXTAUTH_SECRET: z.string(),
  NEXTAUTH_URL: z.string().url(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  PUSHER_APP_ID: z.string(),
  NEXT_PUBLIC_PUSHER_KEY: z.string(),
  PUSHER_SECRET: z.string(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string(),
});
