const generateProject = (name) => {
	return {
		displayName: name,
		transform: {
			'^.+\\.tsx?$': [
				'ts-jest',
				{
					isolatedModules: true,
				},
			],
		},
		testMatch: [`<rootDir>/${name}/**/*.test.ts`],
		setupFilesAfterEnv: [`./${name}/jest.setup.js`],
	};
};

module.exports = {
	verbose: true,
	testEnvironment: 'node',
	projects: ['cdk', 'ingestion-lambda', 'poller-lambdas'].map(generateProject),
};
