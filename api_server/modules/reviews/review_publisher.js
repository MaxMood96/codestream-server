// handle publishing a new or updated code review to the appropriate broadcaster channel

'use strict';

class ReviewPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	async publishReview () {
		let channel;
		const stream = this.stream || await this.request.data.streams.getById(this.review.get('streamId'));
		if (!stream) { return; } // sanity
		if (!stream.get('isTeamStream')) {
			throw 'stream channels are deprecated';
		}
		channel = `team-${this.review.get('teamId')}`;
		/*
		channel = stream.get('isTeamStream') ? 
			`team-${this.review.get('teamId')}` : 
			`stream-${stream.id}`;
		*/
		const message = Object.assign({}, this.data, {
			requestId: this.request.request.id
		});
		try {
			await this.request.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish review update message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = ReviewPublisher;
