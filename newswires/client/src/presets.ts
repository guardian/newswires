export interface Preset {
	name: string;
	id: string;
}

export const sportPresets: Preset[] = [
	{
		name: 'All sports',
		id: 'all-sport',
	},
	{
		name: 'Soccer',
		id: 'soccer',
	},
	{
		name: 'Soccer Scores',
		id: 'soccer-scores',
	},
	{
		name: 'Soccer Tables',
		id: 'soccer-tables',
	},
	{
		name: 'No Soccer',
		id: 'no-soccer',
	},
	{
		name: 'Cricket',
		id: 'cricket',
	},
	{
		name: 'Cricket Results',
		id: 'cricket-results',
	},
	{
		name: 'Rugby League',
		id: 'rugby-league',
	},
	{
		name: 'Rugby Union',
		id: 'rugby-union',
	},
	{
		name: 'Rugby Results',
		id: 'rugby-results',
	},
	{
		name: 'Tennis',
		id: 'tennis',
	},
	{
		name: 'Tennis Results',
		id: 'tennis-results',
	},
	{
		name: 'Cycling',
		id: 'cycling',
	},
	{
		name: 'Cycling Results',
		id: 'cycling-results',
	},
	{
		name: 'Motor Racing',
		id: 'motor-racing',
	},
	{
		name: 'Golf',
		id: 'golf',
	},
	{
		name: 'Golf Results',
		id: 'golf-results',
	},
	{
		name: 'Boxing',
		id: 'boxing',
	},
	{
		name: 'Horse racing',
		id: 'horse-racing',
	},
	{
		name: 'Athletics',
		id: 'athletics',
	},
	{
		name: 'Olympics',
		id: 'olympics',
	},
	{
		name: 'All Data Formats',
		id: 'all-data-formats',
	},
];

export const presets = [
	{ id: 'all-presets', name: 'All', filterOptions: [] },
	{ id: 'all-world', name: 'World', filterOptions: [] },
	{ id: 'all-uk', name: 'UK', filterOptions: [] },
	{ id: 'all-business', name: 'Business', filterOptions: [] },
	{ id: 'all-sport', name: 'Sport', filterOptions: sportPresets },
];

export const presetFilterOptions = (presetId: string) => {
	const preset = presets.find((preset) => preset.id === presetId);

	if (preset) {
		return preset.filterOptions;
	}

	const sportPresetFilterOptions = sportPresets.find(
		(preset) => preset.id === presetId,
	);

	if (sportPresetFilterOptions) {
		return sportPresets;
	}

	return [];
};

export const presetLabel = (presetId: string) => {
	const preset = presets.find((preset) => preset.id === presetId);

	if (preset) {
		return preset.name;
	}

	const sportPresetFilter = sportPresets.find(
		(preset) => preset.id === presetId,
	);

	if (sportPresetFilter) {
		return sportPresetFilter.name;
	}

	return presetId;
};
