import { DB_HOST, DB_PORT } from './db/connection';
import { defineConfig } from '@absolutejs/absolute';

const COMPOSE_FLAGS = '-p postgresql -f db/docker-compose.db.yml'.split(' ');
const dockerCompose = (...rest: string[]): string[] => [
	'docker',
	'compose',
	...COMPOSE_FLAGS,
	...rest
];

export default defineConfig({
	db: {
		kind: 'command',
		command: dockerCompose('up', 'db'),
		ready: { type: 'tcp', host: DB_HOST, port: DB_PORT },
		shutdown: {
			command: dockerCompose('down'),
			timeoutMs: 10_000
		},
		port: DB_PORT,
		visibility: 'internal'
	},
	app: {
		kind: 'absolute',
		entry: 'src/backend/server.ts',
		dependsOn: ['db'],
		assetsDirectory: 'src/backend/assets',
		vueDirectory: 'src/frontend',
		publicDirectory: 'public',
		stylesConfig: 'src/styles/indexes',
		tailwind: {
			input: 'src/styles/tailwind.css',
			output: 'src/styles/indexes/tailwind.out.css'
		}
	}
});
