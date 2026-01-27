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
		name: 'American football',
		id: 'american-football',
	},
	{
		name: 'Athletics',
		id: 'athletics',
	},
	{
		name: 'Australian rules',
		id: 'australian-rules',
	},
	{
		name: 'Baseball',
		id: 'baseball',
	},
	{
		name: 'Basketball',
		id: 'basketball',
	},
	{
		name: 'Boxing',
		id: 'boxing',
	},
	{
		name: 'College sports',
		id: 'college-sports',
	},
	{
		name: 'Cricket',
		id: 'cricket',
	},
	{
		name: 'Cricket scores',
		id: 'cricket-scores',
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
		id: 'golf-scores',
	},
	{
		name: 'Horse racing',
		id: 'horse-racing',
	},
	{
		name: 'Ice hockey',
		id: 'ice-hockey',
	},
	{
		name: 'Motor sport',
		id: 'motor-sport',
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
		id: 'rugby-scores',
	},
	{
		name: 'Tennis',
		id: 'tennis',
	},
	{
		name: 'Tennis scores',
		id: 'tennis-scores',
	},
	{
		name: 'All data formats',
		id: 'all-data-formats',
	},
	{
		name: 'Sport other',
		id: 'sport-other',
	},
];

export const topLevelSportId = 'all-sport';
export const topLevelPresetId = 'all-presets';
export const presets: Preset[] = [
	{ id: topLevelPresetId, name: 'All' },
	{ id: 'all-world', name: 'World' },
	{ id: 'all-uk', name: 'UK' },
	{ id: 'world-plus-uk', name: 'World + UK' },
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
