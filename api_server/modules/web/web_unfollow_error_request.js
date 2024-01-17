'use strict';

const WebRequestBase = require('./web_request_base');

class WebUnfollowErrorRequest extends WebRequestBase {

	async authorize() {
		// no authorization needed
	}

	async process() {
		const errorCode = decodeURIComponent(this.request.query.error || '');
		return super.render('error', {
			title: 'Request failed',
			body: `Your request to unfollow this codemark failed (error code <b>${errorCode}</b>). <a href="https://one.newrelic.com/help-xp">Contact support</a> if you need assistance.`
		});
	}
}

module.exports = WebUnfollowErrorRequest;
