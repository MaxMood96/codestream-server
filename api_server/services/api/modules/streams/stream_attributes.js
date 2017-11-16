'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true
	},
	repoId: {
		type: 'id'
	},
	type: {
		type: 'streamType', // channel, direct, file
		maxLength: 7
	},
	file: {
		type: 'string',
		maxLength: 1024
	},
	name: {
		type: 'string',
		maxLength: 64
	},
	memberIds: {
		type: 'arrayOfIds',
		maxLength: 256
	},
	mostRecentPostId: {
		type: 'id'
	}
};
