'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplyPushToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying a push update to a cached model';
	}

	async updateTestModel (callback) {
		// push this element to the array, and check that it's there
		const update = {
			array: 7
		};
		try {
			await this.data.test.applyOpById(
				this.testModel.id,
				{ '$push': update }
			);
		}
		catch (error) {
			return callback(error);
		}
		this.testModel.attributes.array.push(7);
		callback();
	}
}

module.exports = ApplyPushToCacheTest;
