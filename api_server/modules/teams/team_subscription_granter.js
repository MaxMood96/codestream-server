// handles granting permission to the users in a team to subscribe to the team's messager channel

'use strict';

class TeamSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	// grant permission to the users of a team to subscribe to the team channel
	async grantToMembers () {
		await this.getUsers();			// get the stream users, since only registered users can access
		await this.getTokens();			// get the users' tokens
		await this.grantTeamChannel();	// grant the permissions
	}

	// get the users in a team
	async getUsers () {
		if (this.members) {
			return;
		}
		this.members = await this.data.users.getByIds(
			this.team.get('memberIds') || [],
			{
				// only need these fields
				fields: ['isRegistered', 'accessToken']
			}
		);
	}

	// get the access tokens for each user in the team that is registered
	async getTokens () {
		this.tokens = this.members.reduce((tokens, user) => {
			if (user.get('isRegistered')) {
				tokens.push(user.get('accessToken'));
			}
			return tokens;
		}, []);
	}

	// grant permissions for each registered user to subscribe to the team channel
	async grantTeamChannel () {
		if (this.tokens.length === 0) {
			return;
		}
		const channel = 'team-' + this.team.id;
		try {
			await this.messager.grant(
				this.tokens,
				channel,
				{
					includePresence: true,
					request: this.request
				}
			);
		}
		catch (error) {
			throw `unable to grant permissions for subscription (${channel}): ${error}`;
		}
	}
}

module.exports = TeamSubscriptionGranter;
