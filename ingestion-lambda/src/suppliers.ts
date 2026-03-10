const supplierLookupMap: Record<string, string[]> = {
	REUTERS: ['REUTERS'],
	GUREUTERS: ['Reuters-Newswires'],
	AAP: ['AAP'],
	AFP: ['AFP'],
	AP: [
		'ADVIS',
		'APAPIUS',
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
	MINOR_AGENCIES: ['COMET', 'WIREFAST'],
	HEARTBEAT: ['FIP'],
};

export const lookupSupplier = (
	supplier: string | undefined,
): string | undefined => {
	if (!supplier) {
		return undefined;
	}

	if (supplier.startsWith('PA_') || supplier.startsWith('PA ')) {
		return 'PA';
	}

	return Object.keys(supplierLookupMap).find((key) =>
		supplierLookupMap[key]?.includes(supplier),
	);
};
