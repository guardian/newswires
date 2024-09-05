import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

// eslint-disable-next-line import/no-default-export -- this is the recommended way in https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		checker({
			typescript: true,
		}),
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
