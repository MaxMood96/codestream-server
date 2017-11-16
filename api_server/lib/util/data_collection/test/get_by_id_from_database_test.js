'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');
var DataModel = require('../data_model');

class GetByIdFromDatabaseTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model when getting a model by ID and it is not cached';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createModelDirect
		], callback);
	}

	createModelDirect (callback) {
		this.testModel = new DataModel({
			text: 'hello',
			number: 12345,
			array: [1, 2, 3, 4, 5]
		});
		this.mongoData.test.create(
			this.testModel.attributes,
			(error, createdDocument) => {
				if (error) { return callback(error); }
				this.testModel.id = this.testModel.attributes._id = createdDocument._id;
				callback();
			}
		);
	}

	run (callback) {
		this.data.test.getById(
			this.testModel.id,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateModelResponse();
	}
}

module.exports = GetByIdFromDatabaseTest;
