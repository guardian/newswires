import { constructHeadline, parseEmail } from './processEmailContent';
import {
	longerLoremIpsumSampleMimeEmailData,
	sampleMimeEmailData,
} from './sampleMimeEmailData';

describe('parseEmailBody', () => {
	it('should parse a valid email body', async () => {
		const emailData = sampleMimeEmailData;
		const { from, subject, text, date } = await parseEmail(emailData);
		expect(from).toBe('"Correspondent A" <correspondent.a@example.com>');
		expect(subject).toBe('Test subject line');
		expect(text).toContain('<p>This is some test copy: hello world</p>');
		expect(date).toBe('Wed, 16 Jul 2025 08:38:29 GMT');
	});

	it('should parse a longer valid email body', async () => {
		const emailData = longerLoremIpsumSampleMimeEmailData;
		const { text } = await parseEmail(emailData);
		// paragraph exists without linebreak
		expect(text).toContain('sed do eiusmod tempor');
		expect(text).toContain('est laborum.</p>\n<p>Sed ut perspiciatis');
		expect(text).toContain('nulla pariatur?</p>\n<p>Cras molestie');
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

// TODO add some unit tests for the paragraphing logic, especially for behaviour around lines that are 74/75/76 lines long, after comparison to actual gmail behaviour
