import { cleanBodyTextMarkup } from './cleanMarkup';

describe('cleanBodyTextMarkup', () => {
	it('should wrap all nodes in <p> tags', () => {
		const input = 'This is a <strong>test</strong> string.';
		expect(cleanBodyTextMarkup(input)).toBe(`<p>${input}</p>`);
	});

	it('should not duplicate <p> tags', () => {
		const input = '<p>This is a test string.</p>';
		const expectedOutput = '<p>This is a test string.</p>';
		expect(cleanBodyTextMarkup(input)).toBe(expectedOutput);
	});

	it('should turn <br> tags into new paragraphs if there is content after them', () => {
		const input =
			'<p>This is a test string.<br />This is another test string.</p>';
		const expectedOutput =
			'<p>This is a test string.</p><p>This is another test string.</p>';
		expect(cleanBodyTextMarkup(input)).toBe(expectedOutput);
	});

	it('should flatten nested <p> tags', () => {
		const input =
			'<p>This is a test string.<p>This is another test string.<p>And one more</p></p></p>';
		const expectedOutput =
			'<p>This is a test string.</p><p>This is another test string.</p><p>And one more</p>';
		expect(cleanBodyTextMarkup(input)).toBe(expectedOutput);
	});

	it('should still treat <br>s as new paras when they are embedded in <p> blocks', () => {
		const input =
			'<p>This is a test string.<p>This is another test string.<br>And one more</p></p>';
		const expectedOutput =
			'<p>This is a test string.</p><p>This is another test string.</p><p>And one more</p>';
		expect(cleanBodyTextMarkup(input)).toBe(expectedOutput);
	});

	it('should unwrap lists from <p> tags if present, but otherwise leave them alone', () => {
		const input1 = '<ul><li><p>Item 1</p></li><li>Item 2</li></ul>';
		expect(cleanBodyTextMarkup(input1)).toBe(input1);

		const input2 = `<p>${input1}</p>`;
		expect(cleanBodyTextMarkup(input2)).toBe(input1);
	});

	it('should leave <table> tags alone', () => {
		const input = `<p><table><tr><td>Item 1</td></tr><tr><td>Item 2<p>paragraph embedded in table, <br>which we will leave alone</p></td></tr></table>this should end up in a paragraph, though,<br>and this`;
		const expectedOutput =
			'<table><tr><td>Item 1</td></tr><tr><td>Item 2<p>paragraph embedded in table, <br>which we will leave alone</p></td></tr></table><p>this should end up in a paragraph, though,</p><p>and this</p>';
		expect(cleanBodyTextMarkup(input)).toBe(expectedOutput);
	});

	it('should break the contents of <article>, <div>, etc. into paragraphs if appropriate', () => {
		const input = `<article>Item 1<br>Item 2</article><div><p>Item 3</p><img src="///"> and some text</div>`;
		const expectedOutput = `<article><p>Item 1</p><p>Item 2</p></article><div><p>Item 3</p><p><img src="///"> and some text</p></div>`;
		expect(cleanBodyTextMarkup(input)).toBe(expectedOutput);
	});

	// it('should remove empty <p> tags', () => {
	// 	const input = '<p>  </p><div><p>   </p></div>';
	// 	const expectedOutput = '';
	// 	expect(cleanBodyTextMarkup(input)).toBe(expectedOutput);
	// });

	it('should handle deeply nested mixed content', () => {
		const input =
			'<div><article>text1<section><div>text2<br/>text3</div><p>text4<strong>text5<br>text6</strong></p></section>text7</article></div>';
		const expectedOutput =
			'<div><article><p>text1</p><section><div><p>text2</p><p>text3</p></div><p>text4<strong>text5<br>text6</strong></p></section><p>text7</p></article></div>';
		expect(cleanBodyTextMarkup(input)).toBe(expectedOutput);
	});

	it('should preserve self-closing tags within paragraphs', () => {
		const input = 'Start<br/>Middle<img src="test.jpg"/><hr/>End';
		const expectedOutput =
			'<p>Start</p><p>Middle<img src="test.jpg"><hr>End</p>';
		expect(cleanBodyTextMarkup(input)).toBe(expectedOutput);
	});

	it('should handle multiple consecutive block elements', () => {
		const input =
			'<div>text1</div><article>text2</article><section>text3</section>';
		const expectedOutput =
			'<div><p>text1</p></div><article><p>text2</p></article><section><p>text3</p></section>';
		expect(cleanBodyTextMarkup(input)).toBe(expectedOutput);
	});
});
