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
		name: 'All sports',
		id: 'all-sport',
	},
	{
		name: 'Soccer',
		id: 'soccer',
	},
	{
		name: 'Cricket',
		id: 'cricket',
	},
	{
		name: 'Rugby Union',
		id: 'rugby-union',
	},
	{
		name: 'Tennis',
		id: 'tennis',
	},
	{
		name: 'Cycling',
		id: 'cycling',
	},
	{
		name: 'Formula One',
		id: 'f1',
	},
	{
		name: 'Golf',
		id: 'golf',
	},
	{
		name: 'Boxing',
		id: 'boxing',
	},
	{
		name: 'Rugby League',
		id: 'rugby-league',
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
];

export const presets: Preset[] = [
	{ id: 'all-presets', name: 'All' },
	{ id: 'all-world', name: 'World' },
	{ id: 'all-uk', name: 'UK' },
	{ id: 'all-business', name: 'Business' },
	{ id: 'sports-sublink', name: 'Sport', child: 'sportPresets' },
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
