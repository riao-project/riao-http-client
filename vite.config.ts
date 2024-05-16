import { defineConfig } from 'vite';

export default defineConfig({
	root: './src/',
	base: './',
	build: {
		outDir: '../dist/src/',
		emptyOutDir: false,
		lib: {
			entry: './index',
			name: '@riao/http-client',
			fileName: 'index',
		},
	},
});
