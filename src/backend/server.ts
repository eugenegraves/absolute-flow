import { db } from './db';
import { networking, prepare } from '@absolutejs/absolute';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';

const { absolutejs } = await prepare();

const server = new Elysia()
	.use(absolutejs)
	.use(swagger())
	.get('/health', () => ({ ok: true, db: !!db }))
	.use(networking)
	.on('error', (event) => {
		const { request } = event;
		console.error(
			`Server error on ${request.method} ${request.url}: ${event.error}`
		);
	});

export type Server = typeof server;
