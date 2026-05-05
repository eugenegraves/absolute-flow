import type { DB } from '../db';
import { eq } from 'drizzle-orm';
import { columns } from '../../../db/schema';

export const createColumn = async (
	db: DB,
	input: { boardId: string; title: string; orderIndex: number }
) => {
	const [created] = await db
		.insert(columns)
		.values(input)
		.returning();
	if (!created) throw new Error('Failed to create column');
	return created;
};

export const updateColumn = async (
	db: DB,
	id: string,
	patch: { title?: string; orderIndex?: number }
) => {
	const [updated] = await db
		.update(columns)
		.set(patch)
		.where(eq(columns.id, id))
		.returning();
	return updated ?? null;
};

export const deleteColumn = async (db: DB, id: string) => {
	const [deleted] = await db
		.delete(columns)
		.where(eq(columns.id, id))
		.returning();
	return deleted ?? null;
};
