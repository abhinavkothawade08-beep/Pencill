import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_URL is required')
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty'),
});

const serverEnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_READING_API_KEY: z.string().min(1).optional(),
  GEMINI_READING_MODEL: z.string().min(1).optional(),
});

export const envSchema = clientEnvSchema.merge(serverEnvSchema);

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type AppEnv = z.infer<typeof envSchema>;

function getRawEnv(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };
}

export function validateClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    console.error('❌ Invalid client environment variables:', result.error.flatten().fieldErrors);
    throw new Error(`Invalid client environment configuration: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
  }

  return result.data;
}

export function validateServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('validateServerEnv cannot be executed in the browser.');
  }

  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid server environment variables:', result.error.flatten().fieldErrors);
    throw new Error(`Invalid server environment configuration: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
  }

  return result.data;
}

export const env = {
  get supabaseUrl(): string {
    return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  },
  get supabaseAnonKey(): string {
    return (
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      ''
    ).trim();
  },
  get geminiApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY?.trim();
  },
  get geminiReadingApiKey(): string | undefined {
    return (process.env.GEMINI_READING_API_KEY || process.env.GEMINI_API_KEY)?.trim();
  },
  get geminiReadingModel(): string | undefined {
    return process.env.GEMINI_READING_MODEL?.trim();
  },
  get isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return Boolean(url && key && !url.includes('placeholder-project'));
  },
};
