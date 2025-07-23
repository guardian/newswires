import type { SESReceipt } from 'aws-lambda';
import {
	findVerificationFailures,
	processSesMessages,
} from './processSesMessages';

describe('findVerificationFailures', () => {
	it('should return passed as true when all checks pass', () => {
		const receipt = {
			spamVerdict: { status: 'PASS' },
			virusVerdict: { status: 'PASS' },
			spfVerdict: { status: 'PASS' },
			dkimVerdict: { status: 'PASS' },
			dmarcVerdict: { status: 'PASS' },
		} as SESReceipt;
		const result = findVerificationFailures(receipt);
		expect(result.hasFailures).toBe(false);
		expect(result.failedChecks).toEqual([]);
	});

	it('should return passed as false when any check fails', () => {
		const receipt = {
			spamVerdict: { status: 'FAIL' },
			virusVerdict: { status: 'PASS' },
			spfVerdict: { status: 'PASS' },
			dkimVerdict: { status: 'PASS' },
			dmarcVerdict: { status: 'PASS' },
		} as SESReceipt;
		const result = findVerificationFailures(receipt);
		expect(result.hasFailures).toBe(true);
		expect(result.failedChecks).toEqual([
			{ name: 'spamVerdict', status: 'FAIL' },
		]);
	});

	it('should return multiple failed checks', () => {
		const receipt = {
			spamVerdict: { status: 'FAIL' },
			virusVerdict: { status: 'FAIL' },
			spfVerdict: { status: 'PASS' },
			dkimVerdict: { status: 'PASS' },
			dmarcVerdict: { status: 'PASS' },
		} as SESReceipt;
		const result = findVerificationFailures(receipt);
		expect(result.hasFailures).toBe(true);
		expect(result.failedChecks).toEqual([
			{ name: 'spamVerdict', status: 'FAIL' },
			{ name: 'virusVerdict', status: 'FAIL' },
		]);
	});
});

describe('parseEmailBody', () => {
	it('should parse a valid email body', async () => {
		const emailData = data();
		const body = await processSesMessages(emailData);
		expect(body).toBeDefined();
		// expect(body.headers).toBeUndefined();
	});
});

function data() {
	return `Return-Path: <pete.faulconbridge@guardian.co.uk>
Received: from mail-lf1-f71.google.com (mail-lf1-f71.google.com [209.85.167.71])
 by inbound-smtp.eu-west-1.amazonaws.com with SMTP id riqe93b6ob9j6ig7c9m1i0bq4n261vaki9ivbio1
 for incoming-copy@editorial-wires-email.code.dev-gutools.co.uk;
 Wed, 16 Jul 2025 08:38:44 +0000 (UTC)
X-SES-Spam-Verdict: PASS
X-SES-Virus-Verdict: PASS
Received-SPF: pass (spfCheck: domain of guardian.co.uk designates 209.85.167.71 as permitted sender) client-ip=209.85.167.71; envelope-from=pete.faulconbridge@guardian.co.uk; helo=mail-lf1-f71.google.com;
Authentication-Results: amazonses.com;
 spf=pass (spfCheck: domain of guardian.co.uk designates 209.85.167.71 as permitted sender) client-ip=209.85.167.71; envelope-from=pete.faulconbridge@guardian.co.uk; helo=mail-lf1-f71.google.com;
 dkim=pass header.i=@theguardian.com;
 dmarc=pass header.from=theguardian.com;
X-SES-RECEIPT: AEFBQUFBQUFBQUFGUWFvZHlwa2JtWTFhOTlJWUhyd2Y2cFQ2YzY0L3ZIdG5EcUJYU3JNWXBMUGdoV0lNd2ZVQXFzd3dBcDFIY210RG1FMytBaEN3YmNxZjRJTEtuL1hpUmFZRjhmYkFmbjdUYWVJL2NESTVEaERlcWwxaUgrcURralhxRUl3YlU2NlFMOW1hQkxtL0N1UVZaTzVvbUxuc1FiODJteHFyN0VUNm9wdVhYK2EvTjRGRS8rNVozaDMySUd0RlRVYmdRR2JqWkZJbGpRbE92OWdZaGJUN2dhYmVpc1A1WU9UaGJGMWZ6bGIwSzVKNFp2ZTVqZzR3Q1kvTTBJdmF2VE03VW55bzhodGswaC9kbkRzNjl6bU5nWld6cmN1aTlCMU9lcUpHZnViRmVibXAyM1RKcHZTNjY4NmxwZHV2R0NpQkVlT0U9
X-SES-DKIM-SIGNATURE: a=rsa-sha256; q=dns/txt; b=FgJd+zlQNmzT2z4qCuvLwDtlG2/Vim3Tr2jjbWILbrPeGAcpt/M5xtpQftn4VuoNYEl6YrMSF2sypc8VqSBCzcihKBrgn9No1elTx6jSqyxI4L9xO+sTMsQD3oaBf/YQd0Oe+rCuSssLiH3cBIfeq10kGAlTqTDVKcQ75TfLgQA=; c=relaxed/simple; s=ihchhvubuqgjsxyuhssfvqohv7z3u4hn; d=amazonses.com; t=1752655124; v=1; bh=XQWOYQa3WyHM7s2W1FSW+h16k1V5uBL8EbZ6qJiP8no=; h=From:To:Cc:Bcc:Subject:Date:Message-ID:MIME-Version:Content-Type:X-SES-RECEIPT;
Received: by mail-lf1-f71.google.com with SMTP id 2adb3069b0e04-553bb73e055so3591993e87.1
        for <incoming-copy@editorial-wires-email.code.dev-gutools.co.uk>; Wed, 16 Jul 2025 01:38:43 -0700 (PDT)
ARC-Seal: i=2; a=rsa-sha256; t=1752655123; cv=pass;
        d=google.com; s=arc-20240605;
        b=GeYK2/vBzupxSfPvAc2JRDkLq4A6Mnqpg1W7BX9l8WhzBo+hUwYugfYprArRyEgKDD
         5owQTY6MLKgxoEP44x1Y6MTskQNz7ytgWiW7jN+aBO9fD4mUBmRmXxL5agqlCloMQAqG
         onrTWOHI7DvvExqI83dY92/M33Bfo8MnAOozp6SakGUd86jWH1FnK8cZ54Uv4LgLyr7P
         NCf2EqGUOoDyI/j4yNXJA9MvV1hjxycf6nDvO8iA9ZUO9/FQc7Ikf5pa2rBcFVSHqGz4
         SIjcBEPxqBDewGpX87EYaRTFEpbv5r0gU4IG2p9zglWEvdIIJK/KFF3pyIH7na9azU3+
         FvzQ==
ARC-Message-Signature: i=2; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20240605;
        h=to:subject:message-id:date:from:mime-version:dkim-signature;
        bh=XQWOYQa3WyHM7s2W1FSW+h16k1V5uBL8EbZ6qJiP8no=;
        fh=GGxoTpSkxcTGTg58tKyarBraIpmptygsnLjoOlL6zD8=;
        b=BpGgnzAIRubPo4sT+SDaReP3k7qKb9OWffXBO9PJiXewRjAsaKDOAEan0/H71Bb6ES
         0mTag0kGMBDcpMeIqof3YeKaAppafvUuPdqz6gPJjJh12ie/2n5r7QiXwoAJPt65arPX
         hAjz56dy74cFWwtQaF5F02OOieWi+4ug5jnVCjtX1D+VeQqt8orvT95pFuJ6WqGYuGxe
         rUgbY7t1cUWn0eAIUzysy4a9rt069jTV3zXVlKG89Oot94pMooxRStQq1OijzIZI5eps
         PDa/VQb4ZEu4ycJLDQwcimilcYNdkxwDwzWLzHuBk2XW033c2FGgdgfcrFP4W6u/Fem7
         1ADQ==;
        dara=google.com
ARC-Authentication-Results: i=2; mx.google.com;
       dkim=pass header.i=@theguardian.com header.s=google header.b=Ikpl8ChM;
       spf=pass (google.com: domain of pete.faulconbridge@guardian.co.uk designates 209.85.220.41 as permitted sender) smtp.mailfrom=pete.faulconbridge@guardian.co.uk;
       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=theguardian.com;
       dara=neutral header.i=@theguardian.com
X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=1e100.net; s=20230601; t=1752655123; x=1753259923;
        h=to:subject:message-id:date:from:mime-version:dkim-signature
         :x-gm-message-state:from:to:cc:subject:date:message-id:reply-to;
        bh=XQWOYQa3WyHM7s2W1FSW+h16k1V5uBL8EbZ6qJiP8no=;
        b=U2weZgyrGVZnoihCs2jDkDc0mrRV/NkpBDTK0yDxjZvlxr6ZHkpU6aHSvAbGyqmHSJ
         UQ8ljb0lgR2GRzH0xvkV5MCByprVwn8F4mNnVYNZ79TwhRh15f8fPXbDKTcQpV+S+vMZ
         fTrd1ZLl4k5QAfI1luB3UyoKJ+60Y1/MhIatTc75Dgp+aBa8i5vUq/EAHsOStxur9L4k
         E1cqeufcyt8PMDTkstRJoaP9KGy3WRoaaM38LDXj/KMhiEmD3H6736lwYxpY4ppcwUGz
         eHxNwz742L9ZFWJEcj/CXVEZY4HOJbHpZqy7Xe/pXjJfIGMo1z5ewHXTV90NpCGrwICT
         QkUQ==
X-Forwarded-Encrypted: i=2; AJvYcCUYbWOmfBFDhANRuT2Y5o41dVEZ0T6vG75iz+T+gld+p19KQ3UcmRmrKog2bw3fR0b+RDXQhCuI2Jj3JmaF@editorial-wires-email.code.dev-gutools.co.uk
X-Gm-Message-State: AOJu0YxRTDIS/KNw3DKOEA0FTiZHbxnnZHGi1OADzosfUaDxcsK0xPih
	Q0O68Bd83iptdDJltTPAaAvuKHGS5kQJOJCm4sbgUPduq7hG5M+0eWQoho+aIXJWeAwLWBcCWad
	nxJBzNaHj4FZsjNMNdzH2bGDLIG4WLmG9+GT4RyYZFgZkK4UMfTT3zD/EsWpKm3hNMVsriSvPbG
	gM7f0lVbLzN8bM4e9uzqKdu+d1O7e8x2axrLHTEn5MAcyOVMd69NAEj4OWgYxVsZ9XCEbzDXJji
	Q==
X-Gm-Gg: ASbGncuhMGg2dnsGaPQ84IpyLDl1DcwRoVYwd9wIbOsY6pc9zE7ZnFiEq/YSzgE7wFf
	Xr/XeSA0wZs4ngqxFhBDx/T6BnfhZ+MqVyY3TeMyvNDvRkyOpYo2K5c2pKwhK8T1wTlN2urMR9I
	XcYmCPcLT1jjFQjqz+72e3ZJgAVyULDnpMt//pFslMgl5hHheWWF7x4phwS1fkPSb3CDB6RVO1d
	FOA3Axa5m5lokmYSKJF0wf77x96/ua/hbUMN/wI20lskp9CGYzjxtZFEc5TMKU6
X-Received: by 2002:a05:6512:612:10b0:553:3621:efee with SMTP id 2adb3069b0e04-55a23f7ff6dmr369354e87.50.1752655123122;
        Wed, 16 Jul 2025 01:38:43 -0700 (PDT)
X-Received: by 2002:a05:6512:612:10b0:553:3621:efee with SMTP id 2adb3069b0e04-55a23f7ff6dmr369310e87.50.1752655121394;
        Wed, 16 Jul 2025 01:38:41 -0700 (PDT)
ARC-Seal: i=1; a=rsa-sha256; t=1752655121; cv=none;
        d=google.com; s=arc-20240605;
        b=FLQXe7YimqJJ6dxZwRA7t1r0xZBHYMsEa1Q0kA7Js1elCp+eWe53HwHVgRuX7pBmRW
         nBKDo4qUSQa7sUQ194FzXv/iBvWJOFJEsqGulKOGFInJXjkscJFGysmdgFSwXKBDVjYq
         6f8vZfqr9gfWH1vU71qE4whIedJu/sno1xZA8B+tTOaaSkSuKz9BbBwVvPVYJYoRe7KE
         JON2VK5mkRrL4l3s/n6J5JPAytXbHXczCCPqI0jYDTeB4xq/7G9ADRYOTCvj1uMiWZzS
         y3mNfygCGvchEKDu4fiPt+mAJtv6dU/P6+iQkbWBHHbfkiWfFU8mFBMAYe1u4LzmksZZ
         3Mmw==
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20240605;
        h=to:subject:message-id:date:from:mime-version:dkim-signature;
        bh=XQWOYQa3WyHM7s2W1FSW+h16k1V5uBL8EbZ6qJiP8no=;
        fh=E5uV4Q6bLGcdZXVS1wWNn0JiPeOjwIGBX8VkZIQKrWU=;
        b=MKOpRzOrsIIUMRQLgg77KkrHKVPqVY9oylxp3uyn8Y33mscHC+E5DSSxhbc/uS3SNI
         2n5Pst4RJRwZWh5YyWOkssDp11GAyntCNQFO3hKKWKeqS0aUT7M3e5dxuQOviqBLerN1
         6uTQ5wJhstFLbQ/WrkgkC8uSl4mh5V25Fs2saPJ9Fn/55+wihqco52s+EhVRfQevzvxV
         lESJLgmHZ1xVzLKtnx8CtsTeSMi+jYkjIt+DEhVDB0pN5fFd9NRTmNDTKOQkWJoZvw2b
         mDkIbUSRA7XAezNioVV789PHE3a/ZmNLjhHiPfin+Dy9Fu29NNIeJqDHrntvki7vXYIe
         ttRw==;
        dara=google.com
ARC-Authentication-Results: i=1; mx.google.com;
       dkim=pass header.i=@theguardian.com header.s=google header.b=Ikpl8ChM;
       spf=pass (google.com: domain of pete.faulconbridge@guardian.co.uk designates 209.85.220.41 as permitted sender) smtp.mailfrom=pete.faulconbridge@guardian.co.uk;
       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=theguardian.com;
       dara=neutral header.i=@theguardian.com
Return-Path: <pete.faulconbridge@guardian.co.uk>
Received: from mail-sor-f41.google.com (mail-sor-f41.google.com. [209.85.220.41])
        by mx.google.com with SMTPS id 2adb3069b0e04-5593c7f87bfsor2430882e87.11.2025.07.16.01.38.40
        for <test.copy@theguardian.com>
        (Google Transport Security);
        Wed, 16 Jul 2025 01:38:41 -0700 (PDT)
Received-SPF: pass (google.com: domain of pete.faulconbridge@guardian.co.uk designates 209.85.220.41 as permitted sender) client-ip=209.85.220.41;
Authentication-Results: mx.google.com;
       dkim=pass header.i=@theguardian.com header.s=google header.b=Ikpl8ChM;
       spf=pass (google.com: domain of pete.faulconbridge@guardian.co.uk designates 209.85.220.41 as permitted sender) smtp.mailfrom=pete.faulconbridge@guardian.co.uk;
       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=theguardian.com;
       dara=neutral header.i=@theguardian.com
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=theguardian.com; s=google; t=1752655120; x=1753259920; darn=theguardian.com;
        h=to:subject:message-id:date:from:mime-version:from:to:cc:subject
         :date:message-id:reply-to;
        bh=XQWOYQa3WyHM7s2W1FSW+h16k1V5uBL8EbZ6qJiP8no=;
        b=Ikpl8ChMBx6AqSYSX+4FUcMoJtMVWEbIt5sS2WIGIqwyBon7YSDQrusFr/QKb7M8V6
         wTBBUI+bMfPh6vdCXxOJIvFqXEBG1A54rjqeBQuLSWYKTkUVDBplHAxuS/TjfInlE22N
         M/qb6wDLu65KUzqJZBEi1ScLjjiKCz8ByRxjdFN1qYDQwUOnv/Zr3rcdGL3U5g+kXS8k
         Cc1z+yBxSl0NYuSFY4w0Mw9wPCjAgOzBT+jo7OdTTJLC/GQ/fGwLXLZ7oSlJvUmwY4Nn
         eIfpR6hPux3wonExKxg6yPeUbfxl11G8ZboPld51uj+7oFhB/cXMJqKzvTzaq0/PXMnK
         fMZw==
X-Google-Smtp-Source: AGHT+IHo9iaT0W8zkOGK7fzHTj0AwNoHfdOB8xI+xVktM1w1xbE7WJiT6Xr3fSBlkZycKsKnqiK5k4vSA5dBEA0x+UY=
X-Received: by 2002:a05:6512:2c0d:b0:553:d122:f8e1 with SMTP id
 2adb3069b0e04-55a23f5ee3fmr630019e87.43.1752655120175; Wed, 16 Jul 2025
 01:38:40 -0700 (PDT)
MIME-Version: 1.0
From: Pete Faulconbridge <pete.faulconbridge@theguardian.com>
Date: Wed, 16 Jul 2025 09:38:29 +0100
X-Gm-Features: Ac12FXxXAnGTsppMjmCsHT7GeQg8HtfFmiI9QfjQypoaSNLHEkNW4yEwfqPnqKs
Message-ID: <CACz+esXaXRL7MOnh+8gomPrqwnn_m_q3XvNdg81D5BMKH+Aixw@mail.gmail.com>
Subject: Test subject line
To: Test Copy <test.copy@theguardian.com>
Content-Type: multipart/alternative; boundary="000000000000da54e0063a07d1aa"
X-SES-Address: test.copy@theguardian.com

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
