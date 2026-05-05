import { relations } from 'drizzle-orm';
import {
	integer,
	pgTable,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';

export const boards = pgTable('boards', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow()
});

export const columns = pgTable('columns', {
	id: uuid('id').primaryKey().defaultRandom(),
	boardId: uuid('board_id')
		.notNull()
		.references(() => boards.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	orderIndex: integer('order_index').notNull()
});

export const tasks = pgTable('tasks', {
	id: uuid('id').primaryKey().defaultRandom(),
	columnId: uuid('column_id')
		.notNull()
		.references(() => columns.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
	description: text('description'),
	orderIndex: integer('order_index').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow()
});

export const boardsRelations = relations(boards, ({ many }) => ({
	columns: many(columns)
}));

export const columnsRelations = relations(columns, ({ one, many }) => ({
	board: one(boards, {
		fields: [columns.boardId],
		references: [boards.id]
	}),
	tasks: many(tasks)
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
	column: one(columns, {
		fields: [tasks.columnId],
		references: [columns.id]
	})
}));

export const schema = {
	boards,
	columns,
	tasks,
	boardsRelations,
	columnsRelations,
	tasksRelations
};

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
export type Column = typeof columns.$inferSelect;
export type NewColumn = typeof columns.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
