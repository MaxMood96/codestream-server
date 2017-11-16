'use strict';

var GetUsersByIdTest = require('./get_users_by_id_test');
var TeamIDRequiredTest = require('./team_id_required_test');
var GetUsersByTeamIdTest = require('./get_users_by_team_id_test');
var ACLTest = require('./acl_test');
var GetUsersOnlyFromTeamTest = require('./get_users_only_from_team_test');

class GetUsersRequestTester {

	getUsersTest () {
		new GetUsersByIdTest().test();
		new GetUsersByTeamIdTest().test();
		new TeamIDRequiredTest().test();
		new ACLTest().test();
		new GetUsersOnlyFromTeamTest().test();
	}
}

module.exports = GetUsersRequestTester;
