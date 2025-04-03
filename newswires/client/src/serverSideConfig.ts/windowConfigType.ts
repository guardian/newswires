interface FeatureSwitches {
	ShowGuSuppliers: boolean;
}

declare global {
	/* ~ Here, declare things that go in the global namespace, or augment
	 *~ existing declarations in the global namespace
	 */
	interface Window {
		configuration: {
			switches: FeatureSwitches;
			stage: string;
		};
	}
}
/* ~ this line is required as per TypeScript's global-modifying-module.d.ts instructions */
export {};
