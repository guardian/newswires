import { parseEmail } from './processEmailContent';

describe('parseEmailBody', () => {
	it('should parse a valid email body', async () => {
		const emailData = sampleMimeEmailData();
		const { from, subject, text, date } = await parseEmail(emailData);
		expect(from).toBe('"Correspondent A" <correspondent.a@example.com>');
		expect(subject).toBe('Test subject line');
		expect(text).toContain('This is some test copy: hello world');
		expect(date).toBe('Wed, 16 Jul 2025 08:38:29 GMT');
	});
});

export function sampleMimeEmailData() {
	return `Return-Path: <correspondent.a@example.com>
Received: abc;
 Wed, 16 Jul 2025 08:38:44 +0000 (UTC)
X-SES-Spam-Verdict: PASS
X-SES-Virus-Verdict: PASS
Received-SPF: 123;
Authentication-Results: amazonses.com;
 spf=pass (spfCheck: domain of example.com designates...;
 dkim=pass header.i=@example.com;
 dmarc=pass header.from=example.com;
X-SES-RECEIPT: abc123
X-SES-DKIM-SIGNATURE: a=rsa-sha256; q=dns/txt; b=1234567;
Received: by mail-lf1-f71.google.com with SMTP id 1234567
        for <incoming@receiving-domain.co.uk>; Wed, 16 Jul 2025 01:38:43 -0700 (PDT)
Return-Path: <correspondent.a@example.com>
From: Correspondent A <correspondent.a@example.com>
Date: Wed, 16 Jul 2025 09:38:29 +0100
X-Gm-Features: 123456
Message-ID: <123456@mail.gmail.com>
Subject: Test subject line
To: Test Copy <test.address@receiving-domain.com>
Content-Type: multipart/alternative; boundary="000000000000da54e0063a07d1aa"
X-SES-Address: test.address@receiving-domain.com

--000000000000da54e0063a07d1aa
Content-Type: text/plain; charset="UTF-8"

This is some test copy: hello world

newline

*some formatting?*

https://github.com/guardian/editorial-wires/pull/182

--000000000000da54e0063a07d1aa
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: quoted-printable

<div dir=3D"ltr">This is some test copy: hello world<div><br></div><div>new=
line</div><div><br></div><div><b>some formatting?</b></div><div><b><br></b>=
</div><div><a href=3D"https://github.com/guardian/editorial-wires/pull/182"=
>https://github.com/guardian/editorial-wires/pull/182</a><b></b></div></div=
>

--000000000000da54e0063a07d1aa--
`;
}
