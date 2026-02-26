import { disableLogs } from './tests/testHelpers';
import { decideEmbargoNote } from './WireDetail';

describe('decideEmbargoNote', () => {
	it('should return a note for status: "withheld" and embargo defined', () => {
		expect(
			decideEmbargoNote({
				status: 'withheld',
				embargo: '2025-03-01T12:00:00.000Z',
			}),
		).toBeDefined();
	});

	it('should handle invalid embargo date formats gracefully', () => {
		disableLogs();

		const invalidEmbargoDate = 'invalid-date-format';
		const note = decideEmbargoNote({
			status: 'withheld',
			embargo: invalidEmbargoDate,
		});
		expect(note).toContain(invalidEmbargoDate);
		expect(note).toContain('unrecognized format');
	});

	it('should not generate a note if embargo is undefined ("withheld" status might not indicate embargo)', () => {
		expect(
			decideEmbargoNote({ status: 'withheld', embargo: undefined }),
		).toBeUndefined();
	});

	it('should return undefined for non-withheld status', () => {
		expect(
			decideEmbargoNote({
				status: 'published',
				embargo: '2025-03-01T12:00:00.000Z',
			}),
		).toBeUndefined();
		expect(
			decideEmbargoNote({ status: 'published', embargo: undefined }),
		).toBeUndefined();
	});
});
