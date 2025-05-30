// Code adapted from: https://github.com/unjs/theme-colors/blob/main/src/utils.ts
function parseColor(color = '') {
	if (typeof color !== 'string') {
		throw new TypeError('Color should be string!');
	}

	const hexMatch = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
	if (hexMatch) {
		return hexMatch.splice(1).map((c) => Number.parseInt(c, 16));
	}

	const hexMatchShort = /^#?([\da-f])([\da-f])([\da-f])$/i.exec(color);
	if (hexMatchShort) {
		return hexMatchShort.splice(1).map((c) => Number.parseInt(c + c, 16));
	}

	if (color.includes(',')) {
		return color.split(',').map((p) => Number.parseInt(p));
	}

	throw new Error('Invalid color format! Use #ABC or #AABBCC or r,g,b');
}

function hexValue(components: number[]) {
	return (
		'#' +
		components.map((c) => `0${c.toString(16).toUpperCase()}`.slice(-2)).join('')
	);
}

function tint(components: number[], intensity: number) {
	return components.map((c) => Math.round(c + (255 - c) * intensity));
}

function shade(components: number[], intensity: number) {
	return components.map((c) => Math.round(c * intensity));
}

const withTint = (intensity: number) => (hex: number[]) => tint(hex, intensity);

const withShade = (intensity: number) => (hex: number[]) =>
	shade(hex, intensity);

export function lightShadeOf(colour: string) {
	const components = parseColor(colour);

	return hexValue(withTint(0.6)(components));
}

export function darkShadeOf(colour: string, shade: number) {
	const components = parseColor(colour);

	return hexValue(withShade(shade)(components));
}
