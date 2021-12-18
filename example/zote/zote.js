let count = 0;
module.exports = {
	name: () => 'zote real',
	count: () => count,
	inc: () => {
		count++;
	},
	fs: require('fs'),
};
