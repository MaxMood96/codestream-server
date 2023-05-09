'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ProviderRefreshTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return `should set an access token for the user when completing an authorization flow for ${this.provider}`;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.init
		], callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that the token stored for the user matches the mock token we created
		let providerInfo = data.user.providerInfo[this.team.id][this.provider];
		if (this.testHost) {
			const starredHost = this.testHost.replace(/\./g, '*');
			providerInfo = providerInfo.hosts[starredHost];
		}
		const token = providerInfo.accessToken;
		Assert.equal(token, this.refreshedMockToken, 'user access token not found to be equal to the mock token upon refresh');

		let expectedData;
		switch (this.provider) {
		case 'asana':
			expectedData = this.getExpectedAsanaTestCallData();
			break;
		case 'jira':
			expectedData = this.getExpectedJiraTestCallData();
			break;
		case 'gitlab':
		case 'gitlab_enterprise':
			expectedData = this.getExpectedGitlabTestCallData();
			break;
		case 'bitbucket':
			expectedData = this.getExpectedBitbucketTestCallData();
			break;
		case 'azuredevops':
			expectedData = this.getExpectedAzureDevOpsTestCallData();
			break;
		default:
			throw `unknown provider ${this.provider}`;
		}

		const { url, parameters } = providerInfo._testCall;
		const expectedUrl = expectedData.url;
		const expectedParameters = expectedData.parameters;
		Assert.equal(url, expectedUrl, 'url passed for token exchange is not correct');
		Assert.deepEqual(parameters, expectedParameters, 'parameters passed for token exchange are not correct');
	}
}

module.exports = ProviderRefreshTest;
