let count = 0;
module.exports = {
	name: () => 'foo real',
	count: () => count,
	inc: () => {
		count++;
	},
	fs: require('fs'),
	zote: require('zote'),
};
