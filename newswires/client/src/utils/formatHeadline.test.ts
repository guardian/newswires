import { headlineForComposer } from './formatHeadline';

describe('formatHeadline', () => {
	const dotCopySupplier = 'UNAUTHED_EMAIL_FEED';
	test('when the supplier is dotcopy, it should strip the sender details', () => {
		const formatedHeadline = headlineForComposer(
			dotCopySupplier,
			'from sender <email@email.com>: subject',
		);
		expect(formatedHeadline).toBe('subject');
	});
	test('when the supplier is dotcopy and there is a colon in the subject it should keep the full subject string', () => {
		const formatedHeadline = headlineForComposer(
			dotCopySupplier,
			'from sender <email@email.com>: subject:matter',
		);
		expect(formatedHeadline).toBe('subject:matter');
	});
	test('when the supplier is dotcopy and there is no colon in the headline it should return the string unchanged', () => {
		const formatedHeadline = headlineForComposer(dotCopySupplier, 'testing');
		expect(formatedHeadline).toBe('testing');
	});
	test('when the supplier is not dotcopy, it should just return the headline', () => {
		const formatedHeadline = headlineForComposer(
			'PA',
			'from sender <email@email.com>: subject',
		);
		expect(formatedHeadline).toBe('from sender <email@email.com>: subject');
	});
});
