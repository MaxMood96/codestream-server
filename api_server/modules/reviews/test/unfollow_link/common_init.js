// base class for many tests of the "GET /no-auth/unfollow-link/review/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		/*
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = this.streamType || 'channel';
		this.streamOptions.isTeamStream = this.isTeamStream || false;
		*/
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			numPosts: 1,
			creatorIndex: 1,
			wantReview: true,
			numChanges: 2,
			wantMarkers: 2
		});

		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.followReview,	// first follow the review
			this.makeCompanyTestGroups, // make some company test group data, as needed
			this.makeTestData		// make the data to use when issuing the test request
		], callback);
	}

	// follow the review so we can unfollow in the test
	followReview (callback) {
		this.review = this.postData[0].review;
		if (this.skipFollow) { return callback(); }
		this.doApiRequest(
			{
				method: 'put',
				path: `/reviews/follow/${this.review.id}`,
				token: this.currentUser.accessToken
			},
			callback
		);
	}

	// make some company test group data, as needed
	// since test group data becomes super-properties in the telemetry tracking, we use
	// this to make sure the appropriate super-properties are set
	makeCompanyTestGroups (callback) {
		if (!this.makeTestGroupData) { return callback(); }
		this.testGroupData = {
			'testGroup1': 'A',
			'testGroup2': 'B'
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/company-test-group/' + this.company.id,
				token: this.currentUser.accessToken,
				data: this.testGroupData
			},
			callback
		);
	}

	// make the data to use when issuing the test request
	makeTestData (callback) {
		const expectedVersion = this.streamType === 'direct' ? 2 : 3;
		const expiresIn = this.expiresIn || 3 * 30 * 24 * 60 * 60 * 1000; // three months
		const expiresAt = Date.now() + expiresIn;
		this.token = new TokenHandler(this.apiConfig.sharedSecrets.auth).generate(
			{
				uid: this.tokenUserId || this.currentUser.user.id
			},
			this.tokenType || 'unf',
			{
				expiresAt
			}
		);


		this.message = {
			review: {
				_id: this.review.id,	// DEPRECATE ME
				id: this.review.id,
				$set: {
					version: expectedVersion,
					modifiedAt: Date.now() // placeholder
				},
				$pull: {
					followerIds: this.currentUser.user.id
				},
				$version: {
					before: expectedVersion - 1,
					after: expectedVersion
				}
			}
		};

		this.modifiedAfter = Date.now();
		this.path = `/no-auth/unfollow-link/review/${this.review.id}?t=${this.token}`;
		this.expectedReview = DeepClone(this.review);
		Object.assign(this.expectedReview, this.message.review.$set);
		this.expectedReview.followerIds = [this.users[1].user.id];
		callback();
	}

	// perform the actual unfollow
	unfollowReview (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: this.path,
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true
				}
			},
			callback
		);
	}
}

module.exports = CommonInit;
