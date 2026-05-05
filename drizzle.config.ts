import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './db/schema.ts',
	out: './db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL ?? 'postgresql://user:password@127.0.0.1:5433/database'
	},
	verbose: true,
	strict: false
});
