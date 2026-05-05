import type { DB } from '../db';
import { eq } from 'drizzle-orm';
import { tasks } from '../../../db/schema';

export const createTask = async (
	db: DB,
	input: {
		columnId: string;
		content: string;
		description?: string | null;
		orderIndex: number;
	}
) => {
	const [created] = await db
		.insert(tasks)
		.values({
			columnId: input.columnId,
			content: input.content,
			description: input.description ?? null,
			orderIndex: input.orderIndex
		})
		.returning();
	if (!created) throw new Error('Failed to create task');
	return created;
};

export const updateTask = async (
	db: DB,
	id: string,
	patch: {
		columnId?: string;
		content?: string;
		description?: string | null;
		orderIndex?: number;
	}
) => {
	const [updated] = await db
		.update(tasks)
		.set(patch)
		.where(eq(tasks.id, id))
		.returning();
	return updated ?? null;
};

export const deleteTask = async (db: DB, id: string) => {
	const [deleted] = await db
		.delete(tasks)
		.where(eq(tasks.id, id))
		.returning();
	return deleted ?? null;
};
