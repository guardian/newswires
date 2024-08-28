const generateProject = (name) => {
	return {
		displayName: name,
		transform: {
			'^.+\\.tsx?$': 'ts-jest',
		},
		testMatch: [`<rootDir>/${name}/**/*.test.ts`],
		setupFilesAfterEnv: [`./${name}/jest.setup.js`],
	};
};

module.exports = {
	verbose: true,
	testEnvironment: 'node',
	projects: ['cdk', 'ingestion-lambda'].map(generateProject),
};
