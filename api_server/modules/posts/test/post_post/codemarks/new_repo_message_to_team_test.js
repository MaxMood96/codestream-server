'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('../common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');

class NewRepoMessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team should receive a message with the repo when a post and codemark are posted to a private stream with a marker from a file stream created on the fly where the repo is also created on the fly';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	makePostData (callback) {
		super.makePostData (() => {
			// add codemark and marker data to the post
			this.data.codemark = this.codemarkFactory.getRandomCodemarkData();
			this.data.codemark.markers = this.markerFactory.createRandomMarkers(1, { withRandomStream: true });
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const repo = response.repos.find(repo => repo.createdAt);
				this.message = { repos: [repo] };
				callback();
			}
		);
	}

	validateMessage (message) {
		if (message.message.stream) { return; }
		return super.validateMessage(message);
	}
}

module.exports = NewRepoMessageToTeamTest;
