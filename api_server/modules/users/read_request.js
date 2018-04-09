// handle the "PUT /read/:streamId" request to indicate the user is "caught up"
// on reading the posts in a particular stream

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');

class ReadRequest extends RestfulRequest {

	// authorize the request before processing....
	async authorize () {
		// they must have access to the stream, unless "all" is specified
		const streamId = this.request.params.streamId.toLowerCase();
		if (streamId === 'all') {
			// all doesn't need authorization, it applies only to the current user
			return;
		}
		const authorized = await this.user.authorizeStream(streamId, this);
		if (!authorized) {
			throw this.errorHandler.error('updateAuth', { reason: 'user not in stream' });
		}
	}

	// process the request...
	async process () {
		// unset the lastReads value for the given stream, or simply remove the lastReads
		// value completely if "all" specified
		this.streamId = this.request.params.streamId.toLowerCase();
		if (this.streamId === 'all') {
			this.op = {
				'$unset': {
					lastReads: true
				}
			};
		}
		else {
			this.op = {
				'$unset': {
					['lastReads.' + this.streamId]: true
				}
			};
		}
		await this.data.users.applyOpById(
			this.user.id,
			this.op
		);
	}

	// after the response is returned....
	async postProcess () {
		// send the preferences update on the user's me-channel, so other active
		// sessions get the message
		const channel = 'user-' + this.user.id;
		const message = {
			user: {
				_id: this.user.id
			},
			requestId: this.request.id
		};
		Object.assign(message.user, this.op);
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish lastReads message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = ReadRequest;
