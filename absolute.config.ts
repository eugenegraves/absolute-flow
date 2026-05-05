import { defineConfig } from '@absolutejs/absolute';

export default defineConfig({
	assetsDirectory: 'src/backend/assets',
	buildDirectory: 'build',
	vueDirectory: 'src/frontend',
	publicDirectory: 'public',
	stylesConfig: 'src/styles/indexes',
	tailwind: {
		input: 'src/styles/tailwind.css',
		output: 'src/styles/indexes/tailwind.out.css'
	}
});
