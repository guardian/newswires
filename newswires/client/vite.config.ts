import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import path from 'path';


// eslint-disable-next-line import/no-default-export -- this is the recommended way in https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		checker({
			typescript: true,
		}),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname),
		},
	},
	build: {
		manifest: true,
		assetsDir: '',
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
			},
		},
	},
	server: {
		origin: 'https://newswires.local.dev-gutools.co.uk',
		hmr: {
			protocol: 'wss',
			host: 'hmr.newswires.local.dev-gutools.co.uk',
			clientPort: 443,
		},
		fs: {
			allow: [path.resolve(__dirname)],
		},
	},
});
