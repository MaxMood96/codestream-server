'use strict';

const CodemarkTest = require('./codemark_test');

class CodemarkMarkerTest extends CodemarkTest {

	constructor (options) {
		super(options);
		this.expectMarkers = 1;
		this.repoOptions.creatorIndex = 1;
		this.expectedSeqNum = 2;
		this.expectedStreamVersion = 3;
		this.expectStreamMarkers = 2;
	}

	get description () {
		return 'should return the post with an codemark and a marker when creating a post with codemark info and marker info';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codemark.markers = this.markerFactory.createRandomMarkers(
				this.expectMarkers,
				{
					fileStreamId: this.repoStreams[0].id,
					commitHash: this.useCommitHash
				}
			);
			callback();
		});
	}
}

module.exports = CodemarkMarkerTest;
