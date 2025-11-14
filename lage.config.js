module.exports = {
	pipeline: {
		test: [],
		lint: [],
		typecheck: [],
		precommit: ['test', 'lint', 'typecheck'],
		build: ['typecheck', 'lint'],
	},
	npmClient: 'npm',
};
