import z from 'zod/v4';

export const PresetGroupNameSchema = z.union([
	z.literal('presets'),
	z.literal('sportPresets'),
]);

export type PresetGroupName = z.infer<typeof PresetGroupNameSchema>;

export interface Preset {
	name: string;
	id: string;
	child?: PresetGroupName;
}

export const sportPresets: Preset[] = [
	{
		name: 'Sport copy',
		id: 'dot-copy',
	},
	{
		name: 'All sport stories',
		id: 'all-sport-stories',
	},
	{
		name: 'Soccer',
		id: 'soccer',
	},
	{
		name: 'Soccer scores',
		id: 'soccer-scores',
	},
	{
		name: 'Soccer tables',
		id: 'soccer-tables',
	},
	{
		name: 'No soccer',
		id: 'no-soccer',
	},
	{
		name: 'Athletics',
		id: 'athletics',
	},
	{
		name: 'Boxing',
		id: 'boxing',
	},
	{
		name: 'Cricket',
		id: 'cricket',
	},
	{
		name: 'Cricket scores',
		id: 'cricket-results',
	},
	{
		name: 'Cycling',
		id: 'cycling',
	},
	{
		name: 'Golf',
		id: 'golf',
	},
	{
		name: 'Golf scores',
		id: 'golf-results',
	},
	{
		name: 'Horse racing',
		id: 'horse-racing',
	},
	{
		name: 'Motor sport',
		id: 'motor-racing',
	},
	{
		name: 'Olympics',
		id: 'olympics',
	},
	{
		name: 'Rugby league',
		id: 'rugby-league',
	},
	{
		name: 'Rugby union',
		id: 'rugby-union',
	},
	{
		name: 'Rugby scores',
		id: 'rugby-results',
	},
	{
		name: 'Tennis',
		id: 'tennis',
	},
	{
		name: 'Tennis scores',
		id: 'tennis-results',
	},
	{
		name: 'All data formats',
		id: 'all-data-formats',
	},
];

export const topLevelSportId = 'all-sport';
export const topLevelPresetId = 'all-presets';
export const presets: Preset[] = [
	{ id: topLevelPresetId, name: 'All' },
	{ id: 'all-news', name: 'All News' },
	{ id: 'all-world', name: 'World' },
	{ id: 'all-uk', name: 'UK' },
	{ id: 'all-business', name: 'Business' },
	{ id: topLevelSportId, name: 'Sport', child: 'sportPresets' },
];

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

export const presetIsInSports = (presetId: string): boolean => {
	return sportPresets.map((p) => p.id).includes(presetId);
};
