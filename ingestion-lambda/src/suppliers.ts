const supplierLookupMap: Record<string, string[]> = {
	REUTERS: ['REUTERS'],
	GUREUTERS: ['Reuters-Newswires'],
	AAP: ['AAP'],
	AP: [
		'ADVIS',
		'AP ADVIS',
		'AP APAPI',
		'AP APBIZWIR',
		'AP APMAW',
		'APBIZWIR',
		'AP ENTERTAINMENT',
		'AP FEATURES',
		'AP LOST',
		'APMAW',
		'AP NATIONAL',
		'AP POLITICS',
		'AP USSPBBL',
		'AP USSPBKL',
		'AP USSPCAR',
		'AP USSPCOL',
		'AP USSPFBL',
		'AP USSPGLF',
		'AP USSPHKY',
		'AP USSPOTHER',
		'AP USSPSOC',
		'AP USSPTEN',
		'AP WASH',
		'AP WEATHER',
		'AP WORLD',
		'ENTERTAINMENT',
		'FEATURES',
		'LOST',
		'NATIONAL',
		'POLITICS',
		'USSPBBL',
		'USSPBKL',
		'USSPBOX',
		'USSPCAR',
		'USSPCOL',
		'USSPFBL',
		'USSPGLF',
		'USSPHKY',
		'USSPOTHER',
		'USSPSOC',
		'USSPTEN',
		'WASH',
		'WEATHER',
		'WORLD',
	],
	GUAP: [
		// for feeds coming from our own poller
		'AP-Newswires',
	],
	PA: [
		'PA',
		'PA ACCESSWIRE',
		'PA ADVISORY',
		'PA AGILITY PR SOLUTIONS',
		'PA BUSINESSWIRE',
		'PA DEMOCRACY NEWS ALLIANCE',
		'PA EON',
		'PA EQS NEWSWIRE',
		'PA GLOBENEWSWIRE',
		'PA LATEST',
		'PA MARKETTIERS',
		'PA NEWS AKTUELL',
		'PA NEWSFILE',
		'PA OVO',
		'PA PA',
		'PA PA ADVISORY',
		'PA PA MEDIA ASSIGNMENTS',
		'PA PA MEDIA PRESS CENTRES',
		'PA PA RACING DATA',
		'PA PA SPORT',
		'PA PA SPORT DATA',
		'PA PA SPORT LATEST',
		'PA PA SPORT SNAP',
		'PA PRESSAT',
		'PA PR NEWSWIRE',
		'PA RESPONSESOURCE',
		'PA RNS',
		'PA ROYAL ACADEMY OF ENGINEERING',
		'PA SNAP',
		'PA THE TRUSSELL TRUST',
		'PA UK GOVERNMENT AND PUBLIC SECTOR',
		'PA HSL',
		'PA JUST GROUP',
		'PA BROOKE ACTION FOR WORKING HORSES AND DONKEYS',
	],
	COMET: ['COMET'],
};

export const lookupSupplier = (supplier: string | undefined ): string | undefined => {
	if (!supplier) {
		return undefined;
	}

	return Object.keys(supplierLookupMap).find((key) =>
		supplierLookupMap[key]?.includes(supplier),
	);
}
