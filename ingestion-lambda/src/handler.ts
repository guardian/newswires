export const main = () => {
	console.log('hello, world');
};

if (require.main === module) {
	void (() => main())();
}
