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
	{
		name: 'Dot Copy',
		id: 'dot-copy',
	},
];

export const topLevelSportId = 'all-sport';
export const topLevelPresetId = 'all-presets';
export const presets: Preset[] = [
	{ id: topLevelPresetId, name: 'All' },
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
