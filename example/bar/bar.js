let count = 0;
module.exports = {
	name: () => 'bar real',
	count: () => count,
	inc: () => {
		count++;
	},
	fs: require('fs'),
};
