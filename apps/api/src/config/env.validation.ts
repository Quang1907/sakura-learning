import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000').transform((v) => parseInt(v, 10)),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('3306').transform((v) => parseInt(v, 10)),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('sakura_learning'),
  JWT_SECRET: z.string().min(16).default('sakura_default_dev_secret_key_change_me_32_chars'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174'),
});

export type ValidatedEnv = z.infer<typeof EnvSchema>;

export function validateEnv(env: NodeJS.ProcessEnv): ValidatedEnv {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
}
