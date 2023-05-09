'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const ProviderRefreshTest = require('./provider_refresh_test');
const CommonInit = require('./common_init');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return `user should receive a message with the token data after refreshing an access token with ${this.provider}`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// token data is received on their own me-channel
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.requestSentAt = Date.now();
		this.runRequestAsTest = false;
		BoundAsync.series(this, [
			ProviderRefreshTest.prototype.refreshToken.bind(this),
			this.setExpectedMessage
		], callback);
	}

	// set the message we expect to see
	setExpectedMessage (callback) {
		const expectedData = {
			accessToken: this.refreshedMockToken
		};
		let expectedTestCallData;
		switch (this.provider) {
		case 'trello':
		case 'youtrack':
			break;
		case 'github':
			expectedTestCallData = this.getExpectedGithubTestCallData();
			break;
		case 'asana':
			expectedTestCallData = this.getExpectedAsanaTestCallData();
			break;
		case 'jira':
			expectedTestCallData = this.getExpectedJiraTestCallData();
			break;
		case 'gitlab':
		case 'gitlab_enterprise':
			expectedTestCallData = this.getExpectedGitlabTestCallData();
			break;
		case 'bitbucket':
			expectedTestCallData = this.getExpectedBitbucketTestCallData();
			break;
		case 'azuredevops':
			expectedTestCallData = this.getExpectedAzureDevOpsTestCallData();
			break;
		default:
			throw `unknown provider ${this.provider}`;
		}
		expectedData.accessToken = this.refreshedMockToken;
		if (expectedTestCallData) {
			expectedData._testCall = expectedTestCallData;
		}
		// issue the provider-token request, and establish the message we expect to receive
		let key = `providerInfo.${this.team.id}.${this.provider}`;
		if (this.testHost) {
			const starredHost = this.testHost.replace(/\./g, '*');
			key += `.hosts.${starredHost}`;
		}
		this.message = {
			user: {
				id: this.currentUser.user.id,
				_id: this.currentUser.user.id, // DEPRECATE ME
				$set: {
					version: 6,
					modifiedAt: Date.now(),
					[key]: expectedData
				},
				$version: {
					before: 5,
					after: 6
				}
			}
		};
		callback();
	}

	validateMessage (message) {
		Assert(message.message.user.$set.modifiedAt >= this.requestSentAt, 'modifiedAt not set');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		let key = `providerInfo.${this.team.id}.${this.provider}`;
		if (this.testHost) {
			const starredHost = this.testHost.replace(/\./g, '*');
			key += `.hosts.${starredHost}`;
		}
		const providerInfo = message.message.user.$set[key];
		const expectedProviderInfo = this.message.user.$set[key];
		expectedProviderInfo.refreshToken = 'refreshMe';
		const expiresIn = ['jira', 'asana', 'azuredevops'].includes(this.provider) ? 3600 : 7200;
		Assert(providerInfo.expiresAt > this.requestSentAt + (expiresIn - 6) * 1000, `expiresAt not set for ${this.provider}`);
		expectedProviderInfo.expiresAt = providerInfo.expiresAt;
		return super.validateMessage(message);
	}
}

module.exports = MessageTest;
