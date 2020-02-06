'use strict';

const GetChangesetTest = require('./get_changeset_test');

class ACLTest extends GetChangesetTest {

	constructor (options) {
		super(options);
		this.streamOptions.members = [];
	}

	get description () {
		return `should return an error when trying to fetch a changeset for a review from a ${this.type} stream that i'm not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	 // readAuth
		};
	}
}

module.exports = ACLTest;
