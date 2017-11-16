'use strict';

var ConfirmationTest = require('./confirmation_test');

class EmailMismatchTest extends ConfirmationTest {

	get description () {
		return 'should return an error when confirming a registration with an email that doesn\'t match the original email used during registration';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'USRC-1005'
		};
	}

	before (callback) {
		super.before(() => {
			this.data.email = this.userFactory.randomEmail();
			callback();
		});
	}
}

module.exports = EmailMismatchTest;
