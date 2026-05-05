import { schema } from '../../db/schema';
import { getEnv } from '@absolutejs/absolute';
import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';

export const db = drizzle(new SQL(getEnv('DATABASE_URL')), { schema });

export type DB = typeof db;
