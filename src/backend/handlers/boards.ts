import type { DB } from '../db';
import { eq, asc } from 'drizzle-orm';
import { boards, columns, tasks } from '../../../db/schema';

export type BoardWithChildren = {
	id: string;
	title: string;
	createdAt: Date;
	columns: Array<{
		id: string;
		boardId: string;
		title: string;
		orderIndex: number;
		tasks: Array<{
			id: string;
			columnId: string;
			content: string;
			description: string | null;
			orderIndex: number;
			createdAt: Date;
		}>;
	}>;
};

export const getBoardWithChildren = async (
	db: DB,
	boardId: string
): Promise<BoardWithChildren | null> => {
	const [board] = await db
		.select()
		.from(boards)
		.where(eq(boards.id, boardId));
	if (!board) return null;

	const cols = await db
		.select()
		.from(columns)
		.where(eq(columns.boardId, boardId))
		.orderBy(asc(columns.orderIndex));

	const allTasks = cols.length
		? await db
				.select()
				.from(tasks)
				.orderBy(asc(tasks.orderIndex))
		: [];

	const tasksByColumn = new Map<string, BoardWithChildren['columns'][number]['tasks']>();
	for (const c of cols) tasksByColumn.set(c.id, []);
	for (const t of allTasks) {
		const list = tasksByColumn.get(t.columnId);
		if (list) list.push(t);
	}

	return {
		...board,
		columns: cols.map((c) => ({
			...c,
			tasks: tasksByColumn.get(c.id) ?? []
		}))
	};
};

export const getOrCreateDemoBoard = async (db: DB): Promise<string> => {
	const existing = await db.select().from(boards).limit(1);
	if (existing.length > 0) return existing[0]!.id;

	const [board] = await db
		.insert(boards)
		.values({ title: 'AbsoluteFlow Demo' })
		.returning();
	if (!board) throw new Error('Failed to seed demo board');

	const seededColumns = await db
		.insert(columns)
		.values([
			{ boardId: board.id, title: 'Backlog', orderIndex: 0 },
			{ boardId: board.id, title: 'In Progress', orderIndex: 1 },
			{ boardId: board.id, title: 'Done', orderIndex: 2 }
		])
		.returning();

	const [backlog, inProgress, done] = seededColumns;
	if (!backlog || !inProgress || !done) {
		throw new Error('Failed to seed demo columns');
	}

	await db.insert(tasks).values([
		{
			columnId: backlog.id,
			content: 'Drag me into another column',
			description:
				'Layout transitions are powered by Vue’s <TransitionGroup>; the order persists to Postgres on drop.',
			orderIndex: 0
		},
		{
			columnId: backlog.id,
			content: 'Click any card to edit',
			description:
				'Two-way binding writes back through Drizzle on blur. Try editing this description.',
			orderIndex: 1
		},
		{
			columnId: backlog.id,
			content: 'Rename a column header',
			description: null,
			orderIndex: 2
		},
		{
			columnId: inProgress.id,
			content: 'Drag-and-drop with vue-draggable-plus',
			description: 'Cross-column moves recompute orderIndex and PATCH the moved task.',
			orderIndex: 0
		},
		{
			columnId: inProgress.id,
			content: 'Optimistic UI, durable state',
			description: 'The card moves first; the API call follows. If it fails, the UI reverts.',
			orderIndex: 1
		},
		{
			columnId: done.id,
			content: 'Postgres + Drizzle schema',
			description: 'boards / columns / tasks with UUID PKs and FK cascades.',
			orderIndex: 0
		},
		{
			columnId: done.id,
			content: 'Tailwind v4 dark theme',
			description: '@theme tokens, glass utilities, gradient text.',
			orderIndex: 1
		}
	]);

	return board.id;
};
