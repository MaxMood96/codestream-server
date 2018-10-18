'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');
const PostTestConstants = require(process.env.CS_API_TOP + '/modules/posts/test/post_test_constants');

class InboundEmailTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.ignoreTokenOnRequest = true; // the actual test request should be anonymous
	}

	get description () {
		return `should create and return a post when an inbound email call is made for a ${this.type} stream`;
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/inbound-email';
	}

	getExpectedFields () {
		return { post: PostTestConstants.EXPECTED_POST_FIELDS };
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back a post with the attributes we specified
		const post = data.post;
		const errors = [];
		const result = (
			((post.text === this.data.text) || errors.push('text does not match')) &&
			((post.teamId === this.team._id) || errors.push('teamId does not match the team')) &&
			((post.streamId === this.stream._id) || errors.push('streamId does not match')) &&
			((post.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof post.createdAt === 'number') || errors.push('createdAt not number')) &&
			((post.modifiedAt >= post.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((post.creatorId === this.users[1].user._id) || errors.push('creatorId not equal to the post originator ID')) &&
			((post.origin === 'email') || errors.push('origin is not email'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		// verify the post in the response has no attributes that should not go to clients
		this.validateSanitized(post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = InboundEmailTest;
