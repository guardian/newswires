import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { LoremIpsum } from 'lorem-ipsum';
import { main } from './src/handler';

const lorem = new LoremIpsum({});

const loremHtml = new LoremIpsum({}, 'html');

recursivelyScheduleEvent();

function recursivelyScheduleEvent() {
	setTimeout(
		() => {
			const randomSqsMessageId = Math.random().toString(36).substring(7);
			const { body, externalId } = createDummyFeedEntry();

			const recordThatShouldSucceed: SQSRecord = {
				messageId: randomSqsMessageId,
				body: JSON.stringify(body),
				messageAttributes: {
					'Message-Id': { stringValue: externalId, dataType: 'String' },
				},
			} as unknown as SQSRecord;

			const dummyEvent: SQSEvent = {
				Records: [recordThatShouldSucceed],
			};

			main(dummyEvent).then(console.log).catch(console.error);
			recursivelyScheduleEvent();
		},
		3000 + Math.floor(Math.random() * 5000),
	);
}

const KNOWN_MEDIA_CAT_CODES = [
	'a', // Domestic general news items, including local Washington news of national interest.
	'c', // Not applicable (N/A)
	'd', // Food, diet. For use primarily on standing advance features on food, recipes and the like. Frequently used with stories in the Lifestyles package.
	'e', // Entertainment, television and culture news and features.
	'f', // News copy, regardless of dateline, designed primarily for use on financial pages.
	'g', // N/A
	'h', // N/A
	'i', // International items, including stories from the United Nations, U.S. possessions, and undated roundups keyed to foreign events.
	'j', // Lottery results only. (Stories about lotteries or lottery winners carry standard news category codes.)
	'k', // Commentary. Material designed primarily for editorial and op-ed pages. (Not used on national DataStream services.)
	'l', // Lifestyles package.
	'm', // N/A
	'n', // Stories of state or regional interest under domestic datelines, including general news stories with Washington or international datelines. If a regional item is designed primarily for financial pages, the f category is used, and if it is designed primarily for the sports pages, the s category is used.
	'o', // Weather tables and forecast fixtures. Do not use on weather stories.
	'p', // National political copy. Generally used in months before an election.
	'q', // Used only for result or period score of a single sports event. The code is designed to help newspaper computer systems build a list of scores or ignore individual scores and wait for transmissions that group them.
	'r', // Race wire
	's', // Sports stories, standings and results of more than one event.
	't', // Travel copy.
	'v', // Advisories about stories that may carry any of the category letters. This code is also used for news digests and news advisories.
	'w', // Washington-datelined stories handled by the Washington national news desk. The category code is changed to a or i if a subsequent lead shifts to a different city.
];

function createDummyFeedEntry() {
	const usn = Math.random().toString(36).substring(7);
	const firstVersion = new Date().toISOString();
	const versionCreated = new Date().toISOString();
	const dateTimeSent = new Date().toISOString();

	const externalId = `APBIZWIR/${usn}/${dateTimeSent}/0`;

	const keywords = new Array(Math.floor(Math.random() * 5) + 2) // 2-7 keywords
		.fill(0)
		.map(() => lorem.generateWords(Math.floor(Math.random() * 4))) // 0-3 words per keyword
		.join('+'); // to exercise splitting logic elsewhere

	const mediaCatCodes = Array.from(
		new Set([
			KNOWN_MEDIA_CAT_CODES[
				Math.floor(Math.random() * KNOWN_MEDIA_CAT_CODES.length)
			],
			KNOWN_MEDIA_CAT_CODES[
				Math.floor(Math.random() * KNOWN_MEDIA_CAT_CODES.length)
			],
		]),
	).join('+'); // to exercise splitting logic elsewhere

	return {
		externalId: externalId,
		body: {
			uri: `http://${externalId}`,
			'source-feed': 'APBIZWIR',
			usn,
			version: '0',
			type: 'text',
			format: 'GOA-WIRES-NINJS',
			mimeType: 'application/ninjs+json',
			firstVersion,
			versionCreated,
			dateTimeSent,
			originalUrn: '9615291038252416',
			slug: 'CT-NISSAN',
			headline: lorem.generateWords(Math.floor(Math.random() * 5) + 3),
			subhead: lorem.generateWords(Math.floor(Math.random() * 10) + 7),
			byline: '',
			priority: '4',
			subjects: {
				code: '',
			},
			mediaCatCodes,
			keywords,
			organisation: {
				symbols: '',
			},
			tabVtxt: 'X',
			language: 'en',
			ednote: '',
			copyrightHolder: 'Business Wire',
			usage:
				'Copyright Business Wire 2024. This content is intended for editorial use only. For other uses, additional clearances may be required.',
			location: 'LAKEVILLE, Conn.',
			abstract: '',
			body_text: loremHtml.generateParagraphs(
				Math.floor(Math.random() * 4) + 1,
			),
		},
	};
}

// // actual fingerpost entry example
// {
//     "uri": "http://APBIZWIR/039054d5bf3f450dae3760b6c05d8c7c/2024-08-29T12:10:03.000Z/0",
//     "source-feed": "APBIZWIR",
//     "usn": "039054d5bf3f450dae3760b6c05d8c7c",
//     "version": "0",
//     "type": "text",
//     "format": "GOA-WIRES-NINJS",
//     "mimeType": "application/ninjs+json",
//     "firstVersion": "2024-08-29T12:00:00Z",
//     "versionCreated": "2024-08-29T12:02:49Z",
//     "dateTimeSent": "2024-08-29T12:10:03.000Z",
//     "originalUrn": "9615291038252416",
//     "slug": "CT-NISSAN",
//     "headline": "Nissan Sentra Cup Makes Historic Debut at Iconic Lime Rock Park",
//     "subhead": "Nissan Sentra Cup Makes Historic Debut at Iconic Lime Rock Park",
//     "byline": "",
//     "priority": "4",
//     "subjects": {
//       "code": ""
//     },
//     "mediaCatCodes": "f",
//     "keywords": "Electric vehicles+Sports+Parasports",
//     "organisation": {
//       "symbols": ""
//     },
//     "tabVtxt": "X",
//     "language": "en",
//     "ednote": "",
//     "copyrightHolder": "Business Wire",
//     "usage": "Copyright Business Wire 2024. This content is intended for editorial use only. For other uses, additional clearances may be required.",
//     "location": "LAKEVILLE, Conn.",
//     "abstract": "",
//     "body_text": "<p>LAKEVILLE, Conn.--(BUSINESS WIRE)--Aug 29, 2024--</p>\n<p>Nestled in the mountains of small-town western Connecticut, Lime Rock Park has an illustrious past of big-time motorsports dating back to the 1950s, hosting major series like NASCAR and the IMSA SportsCar Championship.</p>\n<p>This press release features multimedia. View the full release here: https://www.businesswire.com/news/home/20240829666968/en/ </p>\n<p>Nestled in the mountains of small-town western Connecticut, Lime Rock Park has an illustrious past of big-time motorsports dating back to the 1950s, hosting major series like NASCAR and the IMSA SportsCar Championship. In July, the historic track welcomed another series: the Nissan Sentra Cup. (Photo: Business Wire)</p>\n<p>In July, the historic track welcomed another series: the Nissan Sentra Cup .</p>\n<p>As nearly 20,000 fans filtered through the gates on a warm summer weekend, many were amazed to see the car they drive, or frequently see on the road, zipping around the 1.5-mile, natural terrain road course.</p>\n<p>“Wait, that’s a Nissan Sentra?” one spectator commented, a sea of 16 Sentra Cup race cars slicing through the hilly, nine-turn layout.</p>\n<p>It sure is.</p>\n<p>History made at a historic American track <br/> The Nissan Sentra Cup, one of three series competing at the Lime Rock SpeedTour, has captured the attention of fans and drivers alike with its competitive spirit and accessibility.</p>\n<p>“It’s a way to live out your motorsports dreams like a professional racer, even if you might not be,” said Didier Marsaud, director, Nissan Canada Communications.</p>\n<p>Created and led by JD Promotion + Competition in partnership with Nissan Canada, Sentra Cup is a 12-race (six weekends), one-make racing series. Because every competitor drives the exact same vehicle, the racing comes down to individual skill – allowing the best drivers to rise to the top.</p>\n<p>The series started as the Nissan Micra Cup in 2014 and evolved into the Nissan Sentra Cup in 2021.</p>\n<p>To qualify, drivers must earn a regional racing license, complete a driving course and acquire a road circuit license. After that, all that’s left is to purchase a Sentra Cup race car and hit the track.</p>\n<p>Accessible to all, the Sentra Cup offers one of the lowest running costs of any Canadian motorsports series. It is Canada’s longest-tenured automotive manufacturer-led series and now, the first to compete in the U.S.</p>\n<p>“It has been a goal of ours, for years, to compete in the U.S. and specifically historic Lime Rock,” said Jacques Deshaies, promoter for JD Promotion + Competition. “When I announced to the drivers we’re coming here, everyone was ecstatic. It is a monumental weekend for the series.”</p>\n<p>A race car for pros, amateurs, and everyone in between <br/> Every competitor drives a stock Nissan Sentra S with only a short list of modifications – notably the suspension, brakes, added racing safety features and a stripped-out interior – to transform the sedan into a bona fide race car ready to tackle some of the most challenging tracks in North America.</p>\n<p>While most Sentra Cup racers are amateurs, a few – such as 2022 champion and current 2024 series leader Valérie Limoges – have a history in professional racing.</p>\n<p>Others, like Nicolas Barrette – currently in second place – are earlier in their careers and have professional aspirations.</p>\n<p>“I want to prove myself as a driver, and this is the perfect series for that,” Barrette said. “It’s very competitive on the track, and I want to be the fastest.”</p>\n<p>In the early years, some racers came to the Nissan series from the famous GT Academy , which turned gamers into racers as documented in the 2023 blockbuster film Gran Turismo. In 2016, American Nic Hamman emerged from GT Academy to compete in the then-Micra Cup before continuing to a career in professional racing.</p>\n<p>Many former racers now compete professionally, including in the GT4 America series , where Nissan plays a major role.</p>\n<p>Most competitors, however, have common 9-to-5 jobs fueled by nights and weekends chasing their passion. Some honed their skills in small karting series or virtually through a race simulator. Others, like Daniel Fortin, are fulfilling a life-long dream. Fortin is competing alongside his son Alexandre, the 2023 Sentra Cup champion and a top performer this year.</p>\n<p>And others are competing for something bigger. Marie-Soleil Labelle, the youngest driver in the series at age 20, has Developmental Language Disorder (DLD), a condition that makes it difficult to understand what others say and to articulate ideas and feelings. As she pursues her racing dreams, she is using her platform to inspire other women and people with disabilities .</p>\n<p>Regardless of background, the competition is fierce. In qualifying at Lime Rock, less than a second separated the fastest and ninth-fastest times. In Lime Rock Race 1, six drivers battled for top position before Mathieu Miron ultimately took first place .</p>\n<p>“There are always competitions within the competition,” said Marsaud. “It makes for a great show for everybody.”</p>\n<p>A return trip to the U.S.? <br/> With four Sentra Cup races remaining this season , there is plenty on the line. Limoges holds the top spot, with Barrette, Fortin and Simon Vincent in striking distance. The final event of the season will take place in Ontario Sept. 27-29.</p>\n<p>“This is my chance to prove myself,” Barrette said. “There’s only one goal: a championship.”</p>\n<p>For Nissan, the series has been a rousing success as it crosses the 10-year mark, providing a unique way to engage with enthusiasts and consumers at a grassroots level.</p>\n<p>All the while, excitement around Nissan sedans is building. This past quarter, Sentra sales were up 7.8 percent in Canada and 40 percent in the U.S .</p>\n<p>And a return trip (or two) to the States is in the works.</p>\n<p>“The Sentra Cup is absolutely going to come back to the U.S.,” Deshaies said.</p>\n<p>About Nissan USA Stories</p>\n<p>The Nissan USA Stories page explores the best of Nissan’s people, products, technology and more. New to the page? Subscribe here to receive alerts when a new story is published.</p>\n<p><p>View source version on businesswire.com:https://www.businesswire.com/news/home/20240829666968/en/ </p>\n<p> CONTACT: Media Contact</p>\n<p>Kevin Raftery</p>\n<p>Manager, Nissan Storytelling + Content</p>\n<p> Kevin.Raftery@nissan-usa.com</p>\n<p>KEYWORD: UNITED STATES NORTH AMERICA CONNECTICUT </p>\n<p>INDUSTRY KEYWORD: VEHICLE TECHNOLOGY PERFORMANCE + SPECIAL INTEREST SPORTS EV/ELECTRIC VEHICLES MOTOR SPORTS ALTERNATIVE VEHICLES/FUELS GENERAL AUTOMOTIVE AFTERMARKET AUTOMOTIVE ENGINEERING AUTOMOTIVE MANUFACTURING OTHER AUTOMOTIVE MANUFACTURING </p>\n<p>SOURCE: Nissan</p>\n<p>Copyright Business Wire 2024.</p>\n<p>PUB: 08/29/2024 08:00 AM/DISC: 08/29/2024 08:02 AM</p>\n<p>http://www.businesswire.com/news/home/20240829666968/en</p>\n"
//   }
