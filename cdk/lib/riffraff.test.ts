import { riffraff } from '../bin/cdk';

describe('generated riff-raff.yaml', () => {
	it('matches the snapshot', () => {
		// @ts-expect-error -- need to read a private var for every test execution and best not to change cdk.ts too much
		const outdir = riffraff.outdir as string;
		const riffRaffYaml = riffraff.toYAML().replaceAll(outdir, 'cdk.out');
		expect(riffRaffYaml).toMatchSnapshot();
	});
});
