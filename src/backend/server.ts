import type LandingPage from '../frontend/pages/LandingPage.vue';
import type BoardPage from '../frontend/pages/BoardPage.vue';
import { db } from './db';
import {
	getBoardWithChildren,
	getOrCreateDemoBoard
} from './handlers/boards';
import {
	createColumn,
	deleteColumn,
	updateColumn
} from './handlers/columns';
import { createTask, deleteTask, updateTask } from './handlers/tasks';
import {
	asset,
	generateHeadElement,
	networking,
	prepare
} from '@absolutejs/absolute';
import { handleVuePageRequest } from '@absolutejs/absolute/vue';
import { swagger } from '@elysiajs/swagger';
import { Elysia, t } from 'elysia';

const { absolutejs, manifest } = await prepare();
const demoBoardId = await getOrCreateDemoBoard(db);

const readFrameworkVersion = async (): Promise<string> => {
	try {
		const pkg = await Bun.file(
			require.resolve('@absolutejs/absolute/package.json')
		).json();
		return typeof pkg.version === 'string' ? pkg.version : 'unknown';
	} catch {
		return 'unknown';
	}
};
const frameworkVersion = await readFrameworkVersion();

const optionalAsset = (key: string): string | null => {
	try {
		return asset(manifest, key);
	} catch {
		return null;
	}
};

const TAILWIND_CSS_URL = '/src/styles/indexes/tailwind.out.css';

const cssPaths = (...keys: string[]): string[] => {
	const paths: string[] = [TAILWIND_CSS_URL];
	for (const key of keys) {
		const path = optionalAsset(key);
		if (path) paths.push(path);
	}
	return paths;
};

const server = new Elysia()
	.use(absolutejs)
	.use(swagger())
	.get('/', () =>
		handleVuePageRequest<typeof LandingPage>({
			headTag: generateHeadElement({
				cssPath: cssPaths('TailwindOutCSS', 'LandingPageCompiledCSS'),
				title: 'AbsoluteFlow — Kanban that never breaks flow'
			}),
			indexPath: asset(manifest, 'LandingPageIndex'),
			pagePath: asset(manifest, 'LandingPage'),
			props: { demoBoardId, frameworkVersion }
		})
	)
	.get(
		'/board/:id',
		async ({ params: { id }, set }) => {
			const board = await getBoardWithChildren(db, id);
			if (!board) {
				set.status = 404;
				return { error: 'Board not found' };
			}
			return handleVuePageRequest<typeof BoardPage>({
				headTag: generateHeadElement({
					cssPath: cssPaths(
						'TailwindOutCSS',
						'BoardPageCompiledCSS',
						'BoardIslandCompiledCSS'
					),
					title: `${board.title} — AbsoluteFlow`
				}),
				indexPath: asset(manifest, 'BoardPageIndex'),
				pagePath: asset(manifest, 'BoardPage'),
				props: { board, frameworkVersion }
			});
		},
		{ params: t.Object({ id: t.String() }) }
	)
	.get(
		'/api/boards/:id',
		async ({ params: { id }, set }) => {
			const board = await getBoardWithChildren(db, id);
			if (!board) {
				set.status = 404;
				return { error: 'Board not found' };
			}
			return board;
		},
		{ params: t.Object({ id: t.String() }) }
	)
	.get('/api/boards/demo/id', () => ({ id: demoBoardId }))
	.post(
		'/api/columns',
		({ body }) => createColumn(db, body),
		{
			body: t.Object({
				boardId: t.String(),
				title: t.String(),
				orderIndex: t.Number()
			})
		}
	)
	.patch(
		'/api/columns/:id',
		async ({ params: { id }, body, set }) => {
			const updated = await updateColumn(db, id, body);
			if (!updated) {
				set.status = 404;
				return { error: 'Column not found' };
			}
			return updated;
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				title: t.Optional(t.String()),
				orderIndex: t.Optional(t.Number())
			})
		}
	)
	.delete(
		'/api/columns/:id',
		async ({ params: { id }, set }) => {
			const deleted = await deleteColumn(db, id);
			if (!deleted) {
				set.status = 404;
				return { error: 'Column not found' };
			}
			return deleted;
		},
		{ params: t.Object({ id: t.String() }) }
	)
	.post(
		'/api/tasks',
		({ body }) => createTask(db, body),
		{
			body: t.Object({
				columnId: t.String(),
				content: t.String(),
				description: t.Optional(t.Nullable(t.String())),
				orderIndex: t.Number()
			})
		}
	)
	.patch(
		'/api/tasks/:id',
		async ({ params: { id }, body, set }) => {
			const updated = await updateTask(db, id, body);
			if (!updated) {
				set.status = 404;
				return { error: 'Task not found' };
			}
			return updated;
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				columnId: t.Optional(t.String()),
				content: t.Optional(t.String()),
				description: t.Optional(t.Nullable(t.String())),
				orderIndex: t.Optional(t.Number())
			})
		}
	)
	.delete(
		'/api/tasks/:id',
		async ({ params: { id }, set }) => {
			const deleted = await deleteTask(db, id);
			if (!deleted) {
				set.status = 404;
				return { error: 'Task not found' };
			}
			return deleted;
		},
		{ params: t.Object({ id: t.String() }) }
	)
	.get('/health', () => ({ ok: true, db: !!db, demoBoardId }))
	.use(networking)
	.on('error', (event) => {
		const { request } = event;
		console.error(
			`Server error on ${request.method} ${request.url}: ${event.error}`
		);
	});

export type Server = typeof server;
