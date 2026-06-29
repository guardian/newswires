import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const nodeProject = (name: string, withSetupFile: boolean) => ({
	test: {
		name,
		root: resolve(import.meta.dirname, name),
		environment: 'node' as const,
		globals: true,
		include: ['**/*.test.{ts,tsx}'],
		setupFiles: withSetupFile ? ['./vitest.setup.ts'] : undefined,
	},
});

// eslint-disable-next-line import/no-default-export -- vitest expects a default export
export default defineConfig({
	test: {
		projects: [
			...[
				'shared',
				'ingestion-lambda',
				'poller-lambdas',
				'fingerpost-queueing-lambda',
				'recomputation-lambda',
			].map((name) => nodeProject(name, false)),
			nodeProject('cdk', true),
			// The client has its own vite.config.ts (for the React plugin needed
			// to transform JSX in component tests), so it's referenced by path.
			resolve(import.meta.dirname, 'newswires/client'),
		],
		silent: 'passed-only',
	},
});
