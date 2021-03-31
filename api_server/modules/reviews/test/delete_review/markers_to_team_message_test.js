'use strict';

const MessageTest = require('./message_test');
const DeleteMarkersTest = require('./delete_markers_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class MarkersToTeamMessageTest extends Aggregation(MessageTest, DeleteMarkersTest) {

	constructor (options) {
		super(options);
		this.wantMarker = true;
	}

	get description () {
		const type = this.streamType || 'team';
		return `members of the team should receive a message with the deactivated markers when a review with markers is deleted in a ${type} stream`;
	}

	/*
	note these overrides are relevant since we can only post to the team stream now

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// postless markers always come in on the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	deleteReview (callback) {
		super.deleteReview(error => {
			if (error) { return callback(error); }
			if (this.streamType !== 'team stream') {
				// for streams, the message received on the team channel should be limited to the markers 
				this.message = {
					markers: this.message.markers
				};
			}
			callback();
		});
	}
	*/
}

module.exports = MarkersToTeamMessageTest;
