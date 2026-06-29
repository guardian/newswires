/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

// eslint-disable-next-line import/no-default-export -- this is the recommended way in https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
	plugins: [
		react(),
		// vite-plugin-checker spawns a persistent TypeScript checker process. Under
		// Vitest (mode === 'test') the process was not being cleaned up and was
		// causing tests in the other projects to hang until they timed out.
		// So we only enable the checker plugin in non-test modes.
		...(mode === 'test' ? [] : [checker({ typescript: true })]),
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
	test: {
		name: 'newswires-client',
		environment: 'jsdom',
		globals: true,
		include: ['src/**/*.test.{ts,tsx}'],
	},
}));
