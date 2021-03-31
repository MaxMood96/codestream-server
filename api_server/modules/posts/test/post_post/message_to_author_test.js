'use strict';

const NewPostMessageToChannelTest = require('./new_post_message_to_channel_test');
const Assert = require('assert');

class MessageToAuthorTest extends NewPostMessageToChannelTest {

	get description () {
		return 'the author of a post should receive a message indicating totalPosts incremented and lastPostCreatedAt set and lastReads for the stream unset when creating a post';
	}

	// make the data the will be used when issuing the request that triggers the message
	makeData (callback) {
		// perform a little trickery here ... set the current user to the creator of the post,
		// since the update message will come back on the creator's me-channel
		super.makeData(error => {
			if (error) { return callback(error); }
			this.currentUser = this.users[1];
			this.broadcasterToken = this.users[1].broadcasterToken;
			this.useToken = this.users[1].accessToken;
			this.updatedAt = Date.now();
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.expectedMessage = {
				user: {
					_id: this.users[1].user.id,	// DEPRECATE ME
					id: this.users[1].user.id,
					$set: {
						version: 6,
						totalPosts: 1,
						lastPostCreatedAt: this.timeBeforePost
					},	// this is a placeholder, it should be some time greater than this
					$unset: {
						[`lastReads.${this.teamStream.id}`]: true
					},
					$version: {
						before: 5,
						after: 6
					}
				}
			};
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// the message comes on the author's me-channel
		this.channelName = `user-${this.users[1].user.id}`;
		// also set the message we expect to receive
		this.timeBeforePost = Date.now();
		callback();
	}

	validateMessage (message) {
		this.message = this.expectedMessage;
		const lastPostCreatedAt = message.message.user.$set.lastPostCreatedAt;
		Assert(typeof lastPostCreatedAt === 'number' && lastPostCreatedAt > this.timeBeforePost, 'lastPostCreatedAt is not set or not greater than the time before the post');
		this.message.user.$set.lastPostCreatedAt = lastPostCreatedAt;	// to pass the base-class validation
		Assert(message.message.user.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = MessageToAuthorTest;
