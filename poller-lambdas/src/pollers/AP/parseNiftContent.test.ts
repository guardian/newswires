import { parse } from 'node-html-parser';
import { fixture1 } from './fixtures/fixture.1';
import { nitfBlockToHtml, parseNitfContent } from './parseNitfContent';

const sample = `
<?xml version="1.0" encoding="utf-8"?>
	<nitf xmlns="http://iptc.org/std/NITF/2006-10-18/" version="-//IPTC//DTD NITF 3.4//EN"
	change.date="October 18, 2006" change.time="19:30">
	<head>
		<docdata>
			<doc-id regsrc="AP" />
			<date.issue norm="20241129T170043Z" />
			<ed-msg info="Eds: UPDATES: with Browns injuries." />
			<doc.copyright holder="AP" year="2024" />
			<identified-content>
				<classifier type="apcategorycode" value="s" />
			</identified-content>
		</docdata>
	</head>
	<body>
		<body.head>
		<hedline>
			<hl1 id="headline">Ex-teammates Jerry Jeudy, Courtland Sutton are on hot streaks as Browns visit Broncos Monday night</hl1>
		</hedline>
		<byline>By The Associated Press</byline>
		<distributor>The Associated Press</distributor>
		<abstract>The Cleveland Browns are seeking just their second victory in Denver in their past nine tries when they visit the Broncos on Monday night. Both teams are coming off big wins and this game marks the return of former Broncos wide receiver Jerry Jeudy, who was traded to Cleveland in the offseason. Jeudy is on a roll with 19 catches over the past three games as he is developing good chemistry with Jaemis Winston. Broncos receiver Courtland Sutton is also on a hot streak. He is coming off his first career game with multiple touchdowns and has had at least 70 receiving yards for five consecutive games.</abstract>
		</body.head>
		<body.content>
		<block>
			<p>Cleveland (3-8) at Denver (7-5)</p>
			<hl2>Browns player to watch</hl2>
			<p>WR Jerry Jeudy. He returns to Denver,</p>
			<hl2>Broncos player to watch</hl2>
			<p>WR Courtland Sutton. He has come on strong with five consecutive</p>
			<p>Intentionally including a second p tag here.</p>
		</block>
		</body.content>
	</body>
</nitf>
`;

describe('nitfToHtml', () => {
	it('should convert hl2 tags to h2 tags', () => {
		const originalObject = parse('<block><hl2>hello world</hl2></block>');
		const htmlString = nitfBlockToHtml(originalObject);
		expect(htmlString).toBe('<h2>hello world</h2>');
	});

	it('should handle both strings and numbers as the content of leaf nodes', () => {
		const originalObject = parse('<block><hl2>1</hl2><hl2>2a</hl2></block>');
		const htmlString = nitfBlockToHtml(originalObject);
		expect(htmlString).toBe('<h2>1</h2><h2>2a</h2>');
	});

	it('should preserve the order of elements, even when there are multiple of the same tag type', () => {
		const originalObject = parse(
			'<block><hl2>1</hl2><p>2</p><p>3</p><hl2>4</hl2><p>5</p></block>',
		);
		const htmlString = nitfBlockToHtml(originalObject);

		expect(htmlString).toBe(`<h2>1</h2><p>2</p><p>3</p><h2>4</h2><p>5</p>`);
	});

	it('should handle nested tags', () => {
		const originalObject = parse(
			'<block><hl2><p><span>2</span></p></hl2></block>',
		);
		const htmlString = nitfBlockToHtml(originalObject);

		expect(htmlString).toBe('<h2><p><span>2</span></p></h2>');
	});

	it('should handle nested tags at the same level as leaf nodes', () => {
		const originalObject = parse(
			'<block><p>1<span><hl2>2</hl2></span></p></block>',
		);
		const htmlString = nitfBlockToHtml(originalObject);

		expect(htmlString).toBe('<p>1<span><h2>2</h2></span></p>');
	});

	it('should remove <media> tags, <media-reference> tags, and any of their contents', () => {
		const originalObject = parse(`<block>
			<p>hello</p>
			<media-reference>media reference</media-reference>
			<media>media</media>
			<p>goodbye<media><span>this shouldn't be rendered</span><media-reference/></media></p>
		</block>`);
		const htmlString = nitfBlockToHtml(originalObject);
		expect(htmlString).toBe('<p>hello</p><p>goodbye</p>');
	});
});

describe('parseNitfContent', () => {
	it('should parse the content correctly', () => {
		const result = parseNitfContent(sample);

		expect(result.abstract).toBe(
			`The Cleveland Browns are seeking just their second victory in Denver in their past nine tries when they visit the Broncos on Monday night. Both teams are coming off big wins and this game marks the return of former Broncos wide receiver Jerry Jeudy, who was traded to Cleveland in the offseason. Jeudy is on a roll with 19 catches over the past three games as he is developing good chemistry with Jaemis Winston. Broncos receiver Courtland Sutton is also on a hot streak. He is coming off his first career game with multiple touchdowns and has had at least 70 receiving yards for five consecutive games.`,
		);
		expect(result.bodyContentHtml).toBe(
			`<p>Cleveland (3-8) at Denver (7-5)</p><h2>Browns player to watch</h2><p>WR Jerry Jeudy. He returns to Denver,</p><h2>Broncos player to watch</h2><p>WR Courtland Sutton. He has come on strong with five consecutive</p><p>Intentionally including a second p tag here.</p>`,
		);
		expect(result.edMessage).toBe('Eds: UPDATES: with Browns injuries.');
		expect(result.headline).toBe(
			'Ex-teammates Jerry Jeudy, Courtland Sutton are on hot streaks as Browns visit Broncos Monday night',
		);
		expect(result.issueDate).toBe('20241129T170043Z');
	});

	it('should parse fixture1 correctly', () => {
		const result = parseNitfContent(fixture1);
		expect(result.bodyContentHtml).toBe(
			`<p>MARLBOROUGH, Mass.--(BUSINESS WIRE)--Dec 5, 2024--</p><p><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2F&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=BJ%27s+Wholesale+Club&amp;index=1&amp;md5=5009012e8e99e3927b81467f254754f8" rel="nofollow" shape="rect">BJ's Wholesale Club</a> (NYSE: BJ), a leading operator of membership warehouse clubs, announced its December Gifting Event running from December 6 - December 24, 2024. The event offers members exceptional deals on toys, video games, kitchen appliances, gift baskets, electronics and more, making it easy for shoppers to cross the last few names off their list in one simple stop. Additionally, BJ’s One® <em></em> Mastercard® <em></em> cardholders can earn Double Rewards (up to 10% back) on <a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fcg%2Fseasonal%2Fgifting%2F&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=eligible+items&amp;index=2&amp;md5=0dcf12f2e026347370432841f6788c42" rel="nofollow" shape="rect">eligible items</a>.</p><p>This press release features multimedia. View the full release here: <a href="https://www.businesswire.com/news/home/20241205994409/en/" rel="nofollow">https://www.businesswire.com/news/home/20241205994409/en/</a></p><p>Hatchimals Alive Mystery Hatch Toy (Photo: Business Wire)</p><p>“We know that this can be a busy and costly time of year for families,” said Tim Morningstar, Chief Membership Officer, BJ’s Wholesale Club. “BJ’s provides members with convenient one-stop shopping and unbeatable value on the season’s most in-demand gifts. The December Gifting Event gives our members an opportunity to take advantage of exclusive deals and help those last-minute holiday shoppers.”</p><p>The December Gifting Event includes up to 30% off on some of the year’s most wish list-worthy toy brands, such as Bluey, Hot Wheels, Barbie and more. Top toy deals include:</p><ul><li><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fproduct%2Fhatchimals-alive-mystery-hatch-toy%2F3000000000005110247%3FitemId%3D3000000000005110249&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Hatchimals+Alive+Mystery+Hatch+Toy&amp;index=3&amp;md5=f48476b0a8351b84c5c2c31a83d47e93" rel="nofollow" shape="rect">Hatchimals Alive Mystery Hatch Toy</a>, $39.99 after $15 savings</li><li><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fproduct%2Fbluey-family-celebration-home-and-backyard-fun%2F3000000000004983811&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Bluey+Family+Celebration+Home+and+Backyard+Fun&amp;index=4&amp;md5=b2f5b78b06cf7c80a21216b63786469a" rel="nofollow" shape="rect">Bluey Family Celebration Home and Backyard Fun</a>, $39.99 after $10 savings</li><li><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fproduct%2Fbarbie-hugs-n-horses-playset%2F3000000000004975771&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Barbie+Hugs+%27N%27+Horses+Playset&amp;index=5&amp;md5=5fa1763d61e1001b59457b7e4eaf4f89" rel="nofollow" shape="rect">Barbie Hugs 'N' Horses Playset</a>, $44.99 after $5 savings</li><li><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fproduct%2Fhot-wheels-city-tunnel-twist-car-wash%2F3000000000004975769&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Hot+Wheels+Tunnel+Twist+Car+Wash&amp;index=6&amp;md5=5d557a59cb4630e43d3abb69b0f779cb" rel="nofollow" shape="rect">Hot Wheels Tunnel Twist Car Wash</a>, $18.99 after $4 savings</li><li><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fproduct%2Fcan-am-renegade-atv-ride-on%2F3000000000005012787&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Can-Am+Renegade+ATV+Ride-on&amp;index=7&amp;md5=8ec945e00fbe2fd7c708b91479fc3b78" rel="nofollow" shape="rect">Can-Am Renegade ATV Ride-on</a>, $174.99 after $75 savings</li><li><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fproduct%2Fbestway-wonderzone-kids-inflatable-mega-bounce-house%2F3000000000005087271&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Bestway+Wonderzone+Kids+Inflatable+Mega+Bounce+House&amp;index=8&amp;md5=168aa735aa86a02c3e2eb32771d893c3" rel="nofollow" shape="rect">Bestway Wonderzone Kids Inflatable Mega Bounce House</a>, $169.99 after $30 savings</li></ul><p>In addition to toys, there will be incredible deals on items across categories that will satisfy even the most hard-to-shop-for people on your list, including:</p><ul><li><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fproduct%2Fsony-ps5-console---fortnite-cobalt-star-bundle%2F3000000000005390259&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Sony+PlayStation+5+Console+-+Fortnite+Cobalt+Star+Bundle&amp;index=9&amp;md5=384cd880a01471f9a350236a4fa01583" rel="nofollow" shape="rect">Sony PlayStation 5 Console - Fortnite Cobalt Star Bundle</a>, $419.99 after $5 savings</li><li><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fproduct%2Filive-pop-up-movie-theater-kit%2F3000000000005031773&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Cinema+Pop+Up+Movie+Theater+Kit+V2&amp;index=10&amp;md5=cf6ae18e44e4bddd2253f69deb2e8722" rel="nofollow" shape="rect">Cinema Pop Up Movie Theater Kit V2</a>, $89.99 after $60 savings</li><li><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fproduct%2Fhp-156-touchscreen-laptop-intel-core-ultra-7-processor-16gb-memory-512gb-ssd%2F3000000000005056251&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=HP+15.6%26quot%3B+Touchscreen+Laptop%2C+Intel+Core+Ultra+7+155H%2C+16GB+Memory%2C+512GB+SSD%2C&amp;index=11&amp;md5=255b80daaec0164af3df26e70575ca43" rel="nofollow" shape="rect">HP 15.6" Touchscreen Laptop, Intel Core Ultra 7 155H, 16GB Memory, 512GB SSD,</a> $579.99 after $220 savings</li><li><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fproduct%2Fsamsung-65-q80d-qled-4k-smart-tv-with-5-year-coverage%2F3000000000004994787&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Samsung+65%26quot%3B+Q80DD+QLED+4K+Smart+TV&amp;index=12&amp;md5=b1c4485f0ecc08e48b8ffab2dae92712" rel="nofollow" shape="rect">Samsung 65" Q80DD QLED 4K Smart TV</a>, $897.99 after $702 savings</li><li><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fproduct%2Fsamsung-galaxy-tab-a9-11-a9-plus-64gb-bundle-with-free-bonus-book-cover%2F3000000000004923769&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Samsung+Galaxy+11%26quot%3B+Tab+A9%2B+Tablet%2C+64GB+Bundle+with+Bonus+Book+Cover&amp;index=13&amp;md5=a48be3fdc128f18c923ba3f374a932fa" rel="nofollow" shape="rect">Samsung Galaxy 11" Tab A9+ Tablet, 64GB Bundle with Bonus Book Cover</a>, $149.99 after $70 savings</li><li><a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fproduct%2Farcade1up-infinity-game-board%2F3000000000005124255&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Arcade1Up+Infinity+Game+Board&amp;index=14&amp;md5=35f969e7ce935bd95289ed8bbfcb64fe" rel="nofollow" shape="rect">Arcade1Up Infinity Game Board</a>, $399.99 after $100 savings</li></ul><p>Non-cardholders can apply for a BJ’s One® Mastercard® ahead of the savings event by visiting the member services desk at their <a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2FclubLocator&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=local+club&amp;index=15&amp;md5=cebc15638e88960680ce0092f1f9d948" rel="nofollow" shape="rect">local club</a> or <a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fbjsone&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=BJs.com%2FBJsone&amp;index=16&amp;md5=b6143cb4043077b36ac043f0265fbf07" rel="nofollow" shape="rect">BJs.com/BJsone</a>.</p><p>BJ’s members can choose from several time-saving options whether shopping online or in-club. Curbside pickup, in-club pickup, same-day delivery and standard delivery are available on <a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2F&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=BJs.com&amp;index=17&amp;md5=2a864db8b9ee1d500ba0fc67cb0bfd27" rel="nofollow" shape="rect">BJs.com</a>, while members shopping in-club can use <a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fabout%2Fordering%2Fexpresspay%2F&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=ExpressPay&amp;index=18&amp;md5=ef2321089fe26ef678a253b0ceb30d35" rel="nofollow" shape="rect">ExpressPay</a> through the BJ’s mobile <a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fbjs.onelink.me%2FrnBI%2Fappdownloadpr&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=app&amp;index=19&amp;md5=1ea283f4d6590b992d19cfad54673149" rel="nofollow" shape="rect">app</a> to scan products as they shop and skip the checkout lines.</p><p>To learn more about BJ’s Wholesale Club, shoppers can visit <a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=http%3A%2F%2Fwww.bjs.com&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=BJs.com&amp;index=20&amp;md5=4ac7701b6772da361bd55213aacf42d6" rel="nofollow" shape="rect">BJs.com</a>. Full details about the BJ’s December Savings Event and BJ’s One® Mastercard® promotion can be found at <a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2Fdeals&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=BJs.com%2Fdeals&amp;index=21&amp;md5=2b16e5f1afdf27e3bb65dd2d3353d756" rel="nofollow" shape="rect">BJs.com/deals</a>.</p><p><em>About BJ's Wholesale Club Holdings, Inc.</em></p><p>BJ’s Wholesale Club Holdings, Inc. (NYSE: BJ) is a leading operator of membership warehouse clubs focused on delivering significant value to its members and serving a shared purpose: “We take care of the families who depend on us.” The company provides a wide assortment of fresh foods, produce, a full-service deli, fresh bakery, household essentials and gas. In addition, BJ’s offers the latest technology, home decor, small appliances, apparel, seasonal items and more to deliver unbeatable value to smart-saving families. Headquartered in Marlborough, Massachusetts, the company pioneered the warehouse club model in New England in 1984 and currently operates 247 clubs and 182 BJ's Gas® locations in 20 states. For more information, please visit us at <a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.bjs.com%2F&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=www.BJs.com&amp;index=22&amp;md5=4192c7fb2828b59736115af43b6cd9ce" rel="nofollow" shape="rect">www.BJs.com</a> or on <a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.facebook.com%2Fbjswholesaleclub%2F&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Facebook&amp;index=23&amp;md5=1fa8c59074414fda9409efd3c0a32043" rel="nofollow" shape="rect">Facebook</a>, and <a href="https://cts.businesswire.com/ct/CT?id=smartlink&amp;url=https%3A%2F%2Fwww.instagram.com%2Fbjswholesale%2F&amp;esheet=54162299&amp;newsitemid=20241205994409&amp;lan=en-US&amp;anchor=Instagram&amp;index=24&amp;md5=6add088c02e6e654bfedc1bc0ec31e10" rel="nofollow" shape="rect">Instagram</a>.</p><p></p><p>View source version on businesswire.com:<a href="https://www.businesswire.com/news/home/20241205994409/en/" rel="nofollow">https://www.businesswire.com/news/home/20241205994409/en/</a></p><p>    CONTACT: Media:</p><p>Kirk Saville</p><p>Head of Corporate Communications</p><p>BJ’s Wholesale Club</p><p>ksaville@bjs.com</p><p>774-512-5597Briana Keene</p><p>Sr. Manager, External Communications</p><p>BJ’s Wholesale Club</p><p>bkeene@bjs.com</p><p>             774-512-6802</p><p>KEYWORD: UNITED STATES NORTH AMERICA MASSACHUSETTS</p><p>INDUSTRY KEYWORD: TECHNOLOGY DISCOUNT/VARIETY DEPARTMENT STORES TOYS SPECIALTY HOME GOODS RETAIL CONSUMER ELECTRONICS ONLINE RETAIL</p><p>SOURCE: BJ's Wholesale Club</p><p>Copyright Business Wire 2024.</p><p>PUB: 12/05/2024 06:00 AM/DISC: 12/05/2024 06:01 AM</p><p>http://www.businesswire.com/news/home/20241205994409/en</p>`,
		);
	});

	it('should cope with missing elements, returning `undefined` for these', () => {
		// nb. we might want to change this behaviour for some fields, but adding the case here now to document current functionality
		const result = parseNitfContent('<nitf></nitf>');
		expect(result.abstract).toBeUndefined();
		expect(result.bodyContentHtml).toBeUndefined();
		expect(result.edMessage).toBeUndefined();
		expect(result.headline).toBeUndefined();
		expect(result.issueDate).toBeUndefined();
	});
});
