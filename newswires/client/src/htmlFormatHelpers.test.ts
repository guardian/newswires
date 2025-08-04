import { htmlFormatBody } from './htmlFormatHelpers';

describe('htmlFormatBody', () => {
	it('should maintain colspan attributes in a table definition', () => {
		const tablehtml = `<table><tr><td colspan="2">Test</td></tr></table>`;
		expect(htmlFormatBody(tablehtml)).toBe(tablehtml);
	});
	it('should maintain style attributes in a table definition', () => {
		const tablehtml = `<table><tr><td style="background-color:#EFE704">Test</td></tr></table>`;
		expect(htmlFormatBody(tablehtml)).toBe(tablehtml);
	});
});
