'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const ObjectID = require('mongodb').ObjectID;

class NotFoundTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when trying to fetch a code error that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// try to get a bogus code error, with an ID that doesn't exist
			this.path = '/code-errors/' + ObjectID();
			callback();
		});
	}
}

module.exports = NotFoundTest;
