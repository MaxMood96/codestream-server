'use strict';

const UnfollowTest = require('./unfollow_test');
const ObjectID = require('mongodb').ObjectID;

class CodeErrorNotFoundTest extends UnfollowTest {

	get description () {
		return 'should return an error when trying to unfollow a non-existent code error';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'code error'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// substitute an ID for a non-existent code error
			this.path = `/code-errors/unfollow/${ObjectID()}`;
			callback();
		});
	}
}

module.exports = CodeErrorNotFoundTest;
