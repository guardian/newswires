export const apItems = [
	{
		item: {
			headline: 'Test headline 1',
			type: 'text',
			pubstatus: 'usable',
			versioncreated: '2025-01-20T10:00:32Z',
			firstcreated: '2025-01-19T05:35:11Z',
			altids: { etag: '123' },
			renditions: { nitf: { href: 'https://example.com/nitf1' } },
			ednote: 'UPDATES',
			keywords: ['keyword2 keyword3 keyword4 keyword5'],
			subject: [
				{
					scheme: 'http://cv.ap.org/id/',
					code: 'test-code-1',
					name: 'keyword1',
					creator: 'Machine',
					rels: ['direct'],
					relevance: 99,
				},
				{
					rels: ['category'],
					creator: 'Editorial',
					code: 'l',
					name: 'l',
				},
				{
					rels: ['category'],
					creator: 'Editorial',
					code: 'a',
					name: 'a',
				},
				{
					rels: ['category'],
					creator: 'Editorial',
					code: 'n',
					name: 'n',
				},
			],
			associations: {
				'1': {
					uri: 'https://api.ap.org/media/v/content/test-uid-1?qt=fi9WsJei_reF&et=1a1aza3c0&ai=bd13ed5ea1d9f71c4547f50a5016433c',
					altids: {
						itemid: 'test-uid-1',
						etag: 'test-etag-1',
					},
					version: 1,
					type: 'picture',
					headline: 'Test headline 1',
				},
				'2': {
					uri: 'https://api.ap.org/media/v/content/test-uid-2?qt=fi9WsJei_reF&et=1a1aza3c0&ai=bd13ed5ea1d9f71c4547f50a5016433c',
					altids: {
						itemid: 'test-uid-2',
						etag: 'test-etag-2',
					},
					version: 1,
					type: 'picture',
					headline: 'Test headline 2',
				},
				'3': {
					uri: 'https://api.ap.org/media/v/content/test-uid-3?qt=fi9WsJei_reF&et=1a1aza3c0&ai=bd13ed5ea1d9f71c4547f50a5016433c',
					altids: {
						itemid: 'test-uid-3',
						etag: 'test-etag-3',
					},
					version: 1,
					type: 'video',
					headline: 'Test headline 3',
				},
			},
		},
	},
	{
		item: {
			headline: 'Test headline 2',
			type: 'text',
			pubstatus: 'usable',
			versioncreated: '2025-01-20T10:01:32Z',
			firstcreated: '2025-01-19T05:36:11Z',
			altids: { etag: '456' },
			renditions: { nitf: { href: 'https://example.com/nitf2' } },
			ednote: 'UPDATES',
		},
	},
];

export const apTransformedItems = [
	{
		externalId: '123',
		body: {
			abstract: 'Abstract content',
			'source-feed': 'AP-Newswires',
			version: '0',
			headline: 'Test headline 1',
			type: 'text',
			status: 'usable',
			versionCreated: '2025-01-20T10:00:32Z',
			firstVersion: '2025-01-19T05:35:11Z',
			originalContentText: '<nitf>content1</nitf>',
			ednote: 'UPDATES',
			imageIds: ['test-uid-1', 'test-uid-2'],
			keywords: ['keyword1', 'keyword2', 'keyword3', 'keyword4', 'keyword5'],
			body_text: '<p>Body content</p>',
			byline: 'Author Name',
		},
	},
	{
		externalId: '456',
		body: {
			abstract: 'Abstract content',
			'source-feed': 'AP-Newswires',
			version: '0',
			headline: 'Test headline 2',
			type: 'text',
			status: 'usable',
			versionCreated: '2025-01-20T10:01:32Z',
			firstVersion: '2025-01-19T05:36:11Z',
			originalContentText: '<nitf>content2</nitf>',
			ednote: 'UPDATES',
			imageIds: [],
			keywords: [],
			body_text: '<p>Body content</p>',
			byline: 'Author Name',
		},
	},
];
