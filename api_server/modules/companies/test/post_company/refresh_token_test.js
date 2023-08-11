'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class RefreshTokenTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}
	
	get description () {
		return 'under Unified Identity, current user should receive an updated New Relic access token on their me-channel, after creating a new org';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		BoundAsync.series(this, [
			super.init,
			this.doCreateCompany,
			this.loginUser
		], callback);
	}

	// create the company and set the expected message
	doCreateCompany (callback) {
		// do the org creation, this should trigger a token refresh,
		// and a message with the new token
		// note we do this before the generateMessage() method so we know what channel
		// to listen to (the user channel of newly created user record), there is a delay
		// before the refresh token is issued anyway
		this.createCompany(error => {
			if (error) { return callback(error); }
			let teamId, userId, expectedVersion;
			if (this.createCompanyResponse.userId) {
				teamId = this.createCompanyResponse.teamId;
				userId = this.createCompanyResponse.userId;
				expectedVersion = 2;
			} else {
				teamId = this.createCompanyResponse.team.id;
				userId = this.createCompanyResponse.user.id;
				expectedVersion = 4;
			}
			this.message = {
				user: {
					id: userId,
					_id: userId,
					$set: {
						[ `providerInfo.${teamId}.newrelic.accessToken` ]: 'placeholder',
						[ `providerInfo.${teamId}.newrelic.expiresAt` ]: Date.now(),
						[ `providerInfo.${teamId}.newrelic.provider` ]: 'azureb2c-csropc',
						[ `providerInfo.${teamId}.newrelic.refreshToken` ]: 'placeholder',
						version: expectedVersion
					},
					$version: {
						before: expectedVersion - 1,
						after: expectedVersion
					}
				}
			};
			callback();
		});
	}

	// login the user with the company creator, we need this so we have their broadcaster token
	loginUser (callback) {
		if (!this.createCompanyResponse.userId) {
			return callback();
		}
		this.doApiRequest(
			{
				method: 'put',
				path: '/login',
				token: this.createCompanyResponse.accessToken
			}, 
			(error, response) => {
				if (error) { return callback(error); }
				this.loginResponse = response;
				response.user.broadcasterToken = response.broadcasterToken;
				this.listeningUser = response;
				callback();
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		let userId;
		if (this.createCompanyResponse.userId) {
			userId = this.createCompanyResponse.userId;
		} else {
			userId = this.createCompanyResponse.user.id;
		}
		this.channelName = `user-${userId}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// the message will have already been generated by doCreateCompany(), but it
		// is delayed, so we don't need to do anything here
		callback();
	}

	validateMessage (message) {
		const expectedUser = this.message.user.$set;
		const user = message.message.user.$set;
		const teamId = this.loginResponse ? this.loginResponse.teams[0].id : this.createCompanyResponse.team.id;
		const key = `providerInfo.${teamId}.newrelic`;
		Assert.strictEqual(typeof user[`${key}.accessToken`], 'string', 'accessToken not set');
		expectedUser[`${key}.accessToken`] = user[`${key}.accessToken`];
		Assert.strictEqual(typeof user[`${key}.refreshToken`], 'string', 'refreshToken not set');
		expectedUser[`${key}.refreshToken`] = user[`${key}.refreshToken`];
		Assert(user[`${key}.expiresAt`] > Date.now(), 'expiresAt not in the future');
		expectedUser[`${key}.expiresAt`] = user[`${key}.expiresAt`];
		return super.validateMessage(message);
	}
}

module.exports = RefreshTokenTest;
