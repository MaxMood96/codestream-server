// handles granting permission to the users in a stream to subscribe to the broadcaster channel
// appropriate to the stream

'use strict';

class StreamSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	// grant permission to the users of a stream to subscribe to the stream channel
	async grantToMembers () {
		await this.getUsers();				// get the stream users, since only registered users can access
		await this.getTokens();				// get the users' tokens
		await this.grantStreamChannel();	// grant the permissions
	}

	// get the users in a stream
	async getUsers () {
		if (this.members) {
			return;
		}
		this.members = await this.data.users.getByIds(
			this.stream.get('memberIds') || [],
			{
				// only need these fields
				fields: ['isRegistered', 'accessToken', 'accessTokens', 'broadcasterToken']
			}
		);
	}

	// get the access tokens for each user in the stream that is registered
	async getTokens () {
		this.tokens = this.members.reduce((tokens, user) => {
			// using the access token for PubNub subscription is to be DEPRECATED
			if (user.get('isRegistered')) {
				tokens.push(user.getAccessToken());
			}
			if (user.get('broadcasterToken')) {
				tokens.push(user.get('broadcasterToken'));
			}
			return tokens;
		}, []);
	}

	// grant permissions for each registered user to subscribe to the stream channel
	async grantStreamChannel () {
		throw 'stream channels are deprecated';
		/*
		if (this.tokens.length === 0) {
			return;
		}
		const channel = 'stream-' + this.stream.id;
		const func = this.revoke ? 'revoke' : 'grant';
		try {
			await this.broadcaster[func](
				this.tokens,
				channel,
				{ 
					request: this.request,
					userIds: this.members.map(m => m.id)
				}
			);
		}
		catch (error) {
			throw `unable to ${func} permissions for subscription (${channel}): ${error}`;
		}
		*/
	}
}

module.exports = StreamSubscriptionGranter;
