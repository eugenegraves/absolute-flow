import { schema } from '../../db/schema';
import type VueExample from '../frontend/pages/VueExample.vue';
import {
	createCountHistory,
	getCountHistory
} from './handlers/countHistoryHandlers';
import {
	asset,
	generateHeadElement,
	getEnv,
	networking,
	prepare
} from '@absolutejs/absolute';
import { handleVuePageRequest } from '@absolutejs/absolute/vue';
import { swagger } from '@elysiajs/swagger';
import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import { Elysia, t } from 'elysia';

const { absolutejs, manifest } = await prepare();

const pool = new SQL(getEnv('DATABASE_URL'));
const db = drizzle(pool, { schema });

const server = new Elysia()
	.use(absolutejs)
	.use(swagger())
	.get('/', () =>
		handleVuePageRequest<typeof VueExample>({
			headTag: generateHeadElement({
				cssPath: [
					asset(manifest, 'VueExampleCSS'),
					asset(manifest, 'VueExampleCompiledCSS')
				],
				title: 'AbsoluteJS + Vue'
			}),
			indexPath: asset(manifest, 'VueExampleIndex'),
			pagePath: asset(manifest, 'VueExample'),
			props: { initialCount: 0 }
		})
	)
	.get('/vue', () =>
		handleVuePageRequest<typeof VueExample>({
			headTag: generateHeadElement({
				cssPath: [
					asset(manifest, 'VueExampleCSS'),
					asset(manifest, 'VueExampleCompiledCSS')
				],
				title: 'AbsoluteJS + Vue'
			}),
			indexPath: asset(manifest, 'VueExampleIndex'),
			pagePath: asset(manifest, 'VueExample'),
			props: { initialCount: 0 }
		})
	)
	.get('/count/:uid', ({ params: { uid } }) => getCountHistory(db, uid), {
		params: t.Object({ uid: t.Number() })
	})
	.post('/count', ({ body: { count } }) => createCountHistory(db, count), {
		body: t.Object({ count: t.Number() })
	})
	.use(networking)
	.on('error', (err) => {
		const { request } = err;
		console.error(
			`Server error on ${request.method} ${request.url}: ${err.message}`
		);
	});

export type Server = typeof server;
