import { riffraff } from '../bin/cdk';

describe('generated riff-raff.yaml', () => {
	it('matches the snapshot', () => {
		// @ts-ignore
		const outdir = riffraff.outdir; // this changes for every test execution and best not to change cdk.ts too much
		const riffRaffYaml = riffraff.toYAML().replaceAll(outdir, 'cdk.out');
		expect(riffRaffYaml).toMatchSnapshot();
	});
});
