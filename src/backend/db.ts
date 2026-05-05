import { DATABASE_URL } from '../../db/connection';
import { schema } from '../../db/schema';
import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';

export const db = drizzle(new SQL(DATABASE_URL), { schema });

export type DB = typeof db;
