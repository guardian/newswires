import { parseEmail } from './processEmailContent';
import { sampleMimeEmailData } from './sampleMimeEmailData';

describe('parseEmailBody', () => {
	it('should parse a valid email body', async () => {
		const emailData = sampleMimeEmailData;
		const { from, subject, text, date } = await parseEmail(emailData);
		expect(from).toBe('"Correspondent A" <correspondent.a@example.com>');
		expect(subject).toBe('Test subject line');
		expect(text).toContain('This is some test copy: hello world');
		expect(date).toBe('Wed, 16 Jul 2025 08:38:29 GMT');
	});
});
