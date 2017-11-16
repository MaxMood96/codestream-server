'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');
var Assert = require('assert');

class GetOneByQuerySkipsCacheTest extends DataCollectionTest {

	get description () {
		return 'should get no models when fetching one model by query, when that model has not yet been persisted';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createRandomModels,
			this.confirmModelsNotPersisted
		], callback);
	}

	confirmModelsNotPersisted (callback) {
		let ids = this.models.map(model => { return model.id; });
		this.mongoData.test.getByIds(
			ids,
			(error, response) => {
				if (error) { return callback(error); }
				if (!(response instanceof Array) || response.length !== 0) {
					return callback('models that should have gone to cache seem to have persisted');
				}
				callback();
			}
		);
	}

	run (callback) {
		let testModel = this.models[4];
		this.testModels = [];
		this.data.test.getOneByQuery(
			{
				text: testModel.get('text'),
				flag: testModel.get('flag')
			},
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		Assert(this.response === null, 'response not null');
	}
}

module.exports = GetOneByQuerySkipsCacheTest;
