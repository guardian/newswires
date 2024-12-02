import { parseNitfContent } from './parseNitfContent';

const sample = `<?xml version="1.0" encoding="utf-8"?><nitf xmlns="http://iptc.org/std/NITF/2006-10-18/" version="-//IPTC//DTD NITF 3.4//EN" change.date="October 18, 2006" change.time="19:30"><head><docdata><doc-id regsrc="AP"/><date.issue norm="20241129T170043Z"/><ed-msg info="Eds: UPDATES: with Browns injuries."/><doc.copyright holder="AP" year="2024"/><identified-content><classifier type="apcategorycode" value="s"/></identified-content></docdata></head><body><body.head><hedline><hl1 id="headline">Ex-teammates Jerry Jeudy, Courtland Sutton are on hot streaks as Browns visit Broncos Monday night</hl1></hedline><byline>By The Associated Press</byline><distributor>The Associated Press</distributor><abstract>The Cleveland Browns are seeking just their second victory in Denver in their past nine tries when they visit the Broncos on Monday night. Both teams are coming off big wins and this game marks the return of former Broncos wide receiver Jerry Jeudy, who was traded to Cleveland in the offseason. Jeudy is on a roll with 19 catches over the past three games as he's developing good chemistry with Jaemis Winston. Broncos receiver Courtland Sutton is also on a hot streak. He's coming off his first career game with multiple touchdowns and has had at least 70 receiving yards for five consecutive games.</abstract></body.head><body.content>
            <block>
              <p>Cleveland (3-8) at Denver (7-5)</p>
              <hl2>Browns player to watch</hl2>
              <p>WR Jerry Jeudy. He returns to Denver,</p>
              <hl2>Broncos player to watch</hl2>
              <p>WR Courtland Sutton. He's come on strong with five consecutive</p>
            </block>
          </body.content></body></nitf>`;

describe('parseNitfContent', () => {
	it('should parse the content correctly', () => {
		const result = parseNitfContent(sample);
		expect(result).toBe(``);
		// expect(result.abstract).toBe(
		// 	`The Cleveland Browns are seeking just their second victory in Denver in their past nine tries when they visit the Broncos on Monday night. Both teams are coming off big wins and this game marks the return of former Broncos wide receiver Jerry Jeudy, who was traded to Cleveland in the offseason. Jeudy is on a roll with 19 catches over the past three games as he's developing good chemistry with Jaemis Winston. Broncos receiver Courtland Sutton is also on a hot streak. He's coming off his first career game with multiple touchdowns and has had at least 70 receiving yards for five consecutive games.`,
		// );
		// expect(result.bodyContent).toBe(
		// 	`<p>Cleveland (3-8) at Denver (7-5)</p><h2>Browns player to watch</h2><p>WR Jerry Jeudy. He returns to Denver,</p><h2>Broncos player to watch</h2><p>WR Courtland Sutton. He's come on strong with five consecutive</p>`,
		// );
	});
});

// /** nitf XML parsed with 'preserveOrder = true' */
// function nitfResponseSample() {
// 	return [
// 		{
// 			'?xml': [
// 				{
// 					'#text': '',
// 				},
// 			],
// 		},
// 		{
// 			nitf: [
// 				{
// 					head: [
// 						{
// 							docdata: [
// 								{
// 									'doc-id': [],
// 								},
// 								{
// 									'date.issue': [],
// 								},
// 								{
// 									'ed-msg': [],
// 								},
// 								{
// 									'doc.copyright': [],
// 								},
// 								{
// 									'identified-content': [
// 										{
// 											classifier: [],
// 										},
// 									],
// 								},
// 							],
// 						},
// 					],
// 				},
// 				{
// 					body: [
// 						{
// 							'body.head': [
// 								{
// 									hedline: [
// 										{
// 											hl1: [
// 												{
// 													'#text':
// 														'Ex-teammates Jerry Jeudy, Courtland Sutton are on hot streaks as Browns visit Broncos Monday night',
// 												},
// 											],
// 										},
// 									],
// 								},
// 								{
// 									byline: [
// 										{
// 											'#text': 'By The Associated Press',
// 										},
// 									],
// 								},
// 								{
// 									distributor: [
// 										{
// 											'#text': 'The Associated Press',
// 										},
// 									],
// 								},
// 								{
// 									abstract: [
// 										{
// 											'#text':
// 												"The Cleveland Browns are seeking just their second victory in Denver in their past nine tries when they visit the Broncos on Monday night. Both teams are coming off big wins and this game marks the return of former Broncos wide receiver Jerry Jeudy, who was traded to Cleveland in the offseason. Jeudy is on a roll with 19 catches over the past three games as he's developing good chemistry with Jaemis Winston. Broncos receiver Courtland Sutton is also on a hot streak. He's coming off his first career game with multiple touchdowns and has had at least 70 receiving yards for five consecutive games.",
// 										},
// 									],
// 								},
// 							],
// 						},
// 						{
// 							'body.content': [
// 								{
// 									block: [
// 										{
// 											p: [
// 												{
// 													'#text': 'Cleveland (3-8) at Denver (7-5)',
// 												},
// 											],
// 										},
// 										{
// 											hl2: [
// 												{
// 													'#text': 'Browns player to watch',
// 												},
// 											],
// 										},
// 										{
// 											p: [
// 												{
// 													'#text': 'WR Jerry Jeudy. He returns to Denver,',
// 												},
// 											],
// 										},
// 										{
// 											hl2: [
// 												{
// 													'#text': 'Broncos player to watch',
// 												},
// 											],
// 										},
// 										{
// 											p: [
// 												{
// 													'#text':
// 														"WR Courtland Sutton. He's come on strong with five consecutive",
// 												},
// 											],
// 										},
// 									],
// 								},
// 							],
// 						},
// 					],
// 				},
// 			],
// 		},
// 	];
// }
