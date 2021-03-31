'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class MessageToStreamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the stream should receive a message with the stream when a private channel stream is updated';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		throw 'stream channels are deprecated';
		// since it is a private stream, the channel will be the stream channel
		this.channelName = `stream-${this.stream.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.updateStream(callback);
	}
}

module.exports = MessageToStreamTest;
