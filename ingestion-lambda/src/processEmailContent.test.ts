import { constructHeadline, parseEmail } from './processEmailContent';
import { sampleMimeEmailData } from './sampleMimeEmailData';

describe('parseEmailBody', () => {
	it('should parse a valid email body', async () => {
		const emailData = sampleMimeEmailData;
		const { from, subject, text, date } = await parseEmail(emailData);
		expect(from).toBe('"Correspondent A" <correspondent.a@example.com>');
		expect(subject).toBe('Test subject line');
		expect(text).toContain('<p>This is some test copy: hello world</p>');
		expect(date).toBe('Wed, 16 Jul 2025 08:38:29 GMT');
	});
});

describe('constructHeadline', () => {
	it('should prefix a from and separate the email from the subject with a colon', () => {
		const headline = constructHeadline('hello@world.com', 'subject');
		expect(headline).toBe('from hello@world.com: subject');
	});
	it('should return from Unknown if the sender is undefined', () => {
		const headline = constructHeadline(undefined, 'subject');
		expect(headline).toBe('from Unknown: subject');
	});

	it('should return No Subject if the subject is undefined', () => {
		const headline = constructHeadline('hello@world.com', undefined);
		expect(headline).toBe('from hello@world.com: No Subject');
	});
});
