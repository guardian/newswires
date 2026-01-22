module.exports = {
	pipeline: {
		test: ['^test'],
		lint: [],
		typecheck: ['^typecheck'], // because there are cross-package types
		precommit: ['test', 'lint', 'typecheck'],
		build: ['typecheck', 'lint'],
	},
	npmClient: 'npm',
};
