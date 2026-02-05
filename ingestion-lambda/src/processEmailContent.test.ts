import { parse as parseHtml } from 'node-html-parser';
import {
	constructHeadline,
	createParagraphsFromEmailHtmlBody,
	createParagraphsFromEmailTextBody,
	parseEmail,
} from './processEmailContent';
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
//

describe('traverse', () => {
	it('should convert the html body of the email into a much simpler format', () => {
		const input = `<div dir="ltr">One first line<div>Two second line</div></div><br>`;

		const output = `<p>One first line</p>
<p>Two second line</p>`;

		expect(createParagraphsFromEmailHtmlBody(parseHtml(input))).toBe(output);
	});

	it('should convert the html body of the email into a much simpler format 2', () => {
		const input = `<div dir="ltr">One first line<br>Two second line</div>`;

		const output = `<p>One first line</p>
<p>Two second line</p>`;

		expect(createParagraphsFromEmailHtmlBody(parseHtml(input))).toBe(output);
	});

	it('should convert the html body of an email into simpler format 3', () => {
		const input = `<div dir="ltr"><div>A more complex example<br><b>Let&#39;s put the parsing <i>through its paces</i></b></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">With some quotes?</blockquote><div><ul><li>With some lists</li><li>With multiple items</li></ul>Did it lose any copy?</div><div><br></div><div>Did the paragraphing make sense?</div><div>Have we dealt with wrapping issues?&nbsp;</div><div><div dir="ltr" class="gmail_signature" data-smartmail="gmail_signature"><div dir="ltr"><br></div></div></div></div>`;

		const output = `<p>A more complex example</p>
<p>Let&#39;s put the parsing through its paces</p>
<p>With some quotes?</p>
<p>With some lists</p>
<p>With multiple itemsDid it lose any copy?</p>
<p>Did the paragraphing make sense?</p>
<p>Have we dealt with wrapping issues?&nbsp;</p>`;

		expect(createParagraphsFromEmailHtmlBody(parseHtml(input))).toBe(output);
	});
});

describe('createParagraphsFromEmailTextBody', () => {
	it('should turn short sentences into paragraphs', () => {
		const text = `
Here's a line that lives by itself.

And this is an entirely separate paragraph.
`.trim();

		const expectedResult = `
<p>Here&apos;s a line that lives by itself.</p>
<p>And this is an entirely separate paragraph.</p>
`.trim();

		expect(createParagraphsFromEmailTextBody(text)).toBe(expectedResult);
	});

	it('should turn some wrapped text into a single paragraph', () => {
		const text = `
Here's a much longer paragraph. It makes use of multiple sentences, and
wraps onto a new line when it would have gone over the 75 character limit.
`.trim();

		const expectedResult = `
<p>Here&apos;s a much longer paragraph. It makes use of multiple sentences, and wraps onto a new line when it would have gone over the 75 character limit.</p>
`.trim();

		expect(createParagraphsFromEmailTextBody(text)).toBe(expectedResult);
	});

	it('should turn some wrapped text into some paragraphs', () => {
		const text = `
Here's a much longer paragraph. It makes use of multiple sentences, and
wraps onto a new line when it would have gone over the 75 character limit.

And here's a followup paragraph!
`.trim();

		const expectedResult = `
<p>Here&apos;s a much longer paragraph. It makes use of multiple sentences, and wraps onto a new line when it would have gone over the 75 character limit.</p>
<p>And here&apos;s a followup paragraph!</p>
`.trim();

		expect(createParagraphsFromEmailTextBody(text)).toBe(expectedResult);
	});

	it('should usually be able to detect the end of a paragraph even without a double-newline', () => {
		const text = `
Here's a much longer paragraph. It makes use of multiple sentences, and
wraps onto a new line when it would have gone over the 75 character limit,
and it's easy to get confused as there's no extra newline.
And here's a followup paragraph!
`.trim();
		const expectedResult = `
<p>Here&apos;s a much longer paragraph. It makes use of multiple sentences, and wraps onto a new line when it would have gone over the 75 character limit, and it&apos;s easy to get confused as there&apos;s no extra newline.</p>
<p>And here&apos;s a followup paragraph!</p>
`.trim();

		expect(createParagraphsFromEmailTextBody(text)).toBe(expectedResult);
	});

	it('should turn some wrapped text into paragraphs', () => {
		const text = `
Here's a much longer paragraph. It makes use of multiple sentences, and
wraps onto a new line when it would have gone over the 75 character limit.

And here's a followup paragraph!
`.trim();

		const expectedResult = `
<p>Here&apos;s a much longer paragraph. It makes use of multiple sentences, and wraps onto a new line when it would have gone over the 75 character limit.</p>
<p>And here&apos;s a followup paragraph!</p>
`.trim();

		expect(createParagraphsFromEmailTextBody(text)).toBe(expectedResult);
	});
});
