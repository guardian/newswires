import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
	plugins: [
		react(),
		checker({
			typescript: true,
		}),
		svgr(),
	],
	build: {
		manifest: true,
		assetsDir: '',
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
			},
		},
	},
	base: '/assets',
	server: {
		origin: 'https://newswires.local.dev-gutools.co.uk',
		hmr: {
			protocol: 'wss',
			host: 'hmr.newswires.local.dev-gutools.co.uk',
			clientPort: 443,
		},
	},
});
