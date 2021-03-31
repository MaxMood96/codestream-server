'use strict';

const PostPostTest = require('./post_post_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class SeqNumTest extends PostPostTest {

	get description () {
		return 'posts created in a stream should have an increasing sequence number';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		BoundAsync.series(this, [
			this.createMorePosts,	// first create some other posts to increment the sequence number
			super.makePostData		// now form the actual post data
		], callback);
	}

	// create several posts, we'll verify the sequence number of each
	createMorePosts (callback) {
		this.additionalPosts = [];
		BoundAsync.timesSeries(
			this,
			5,
			this.createAdditionalPost,
			callback
		);
	}

	// create a single additional post in the stream
	createAdditionalPost (n, callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.additionalPosts.push(response.post);
				callback();
			},
			{
				streamId: this.teamStream.id,
				token: this.token
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify that each post we created got the correct sequence number, it should increase by 1 each time
		for (let i = 0; i < this.additionalPosts.length; i++) {
			Assert(this.additionalPosts[i].seqNum === i + 1, 'additional post ' + i + ' does not have correct sequence number');
		}
		this.expectedSeqNum = this.additionalPosts.length + 1;
		this.expectedStreamVersion += 5;
		super.validateResponse(data);
	}
}

module.exports = SeqNumTest;
