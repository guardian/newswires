export const sampleMimeEmailData = `Return-Path: <correspondent.a@example.com>
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

export const longerLoremIpsumSampleMimeEmailData = `Return-Path: <correspondent.a@example.com>
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

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim
ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque
porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur,
adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore
et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis
nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid
ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea
voluptate velit esse quam nihil molestiae consequatur, vel illum qui
dolorem eum fugiat quo voluptas nulla pariatur?
Cras molestie dignissim arcu sit amet vestibulum. Curabitur id ullamcorper
lectus. Mauris semper suscipit convallis. Nullam justo est, lobortis sit
amet vestibulum et, sagittis quis massa. Interdum et malesuada fames ac
ante ipsum primis in faucibus. Mauris viverra est nec purus aliquam
vulputate. In vitae euismod sem, in gravida nulla. Quisque sed est diam.
  Morbi feugiat, dolor sit amet bibendum imperdiet, augue ante bibendum
tortor, at dignissim leo mi vel sem.

--000000000000da54e0063a07d1aa
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: quoted-printable

<div dir=3D"ltr"><div><span style=3D"color:rgb(0,0,0);font-family:&quot;Ope=
n Sans&quot;,Arial,sans-serif;font-size:14px;text-align:justify">Lorem ipsu=
m dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incidi=
dunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostru=
d exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Dui=
s aute irure dolor in reprehenderit in voluptate velit esse cillum dolore e=
u fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, su=
nt in culpa qui officia deserunt mollit anim id est laborum.</span></div><d=
iv><span style=3D"color:rgb(0,0,0);font-family:&quot;Open Sans&quot;,Arial,=
sans-serif;font-size:14px;text-align:justify">Sed ut perspiciatis unde omni=
s iste natus error sit voluptatem accusantium doloremque laudantium, totam =
rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architect=
o beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia volupt=
as sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores e=
os qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dol=
orem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non n=
umquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaera=
t voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam c=
orporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Qui=
s autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihi=
l molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas null=
a pariatur?</span><div class=3D"gmail-yj6qo"></div><div class=3D"gmail-adL"=
><span style=3D"color:rgb(0,0,0);font-family:&quot;Open Sans&quot;,Arial,sa=
ns-serif;font-size:14px;text-align:justify"></span></div></div><div class=
=3D"gmail-adL"><br></div></div>

--000000000000da54e0063a07d1aa--
`;
