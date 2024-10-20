// handle unit tests for the "PUT /no-auth/login" request

'use strict';

const LoginTest = require('./login_test');
const InvalidPasswordTest = require('./invalid_password_test');
const InvalidEmailTest = require('./invalid_email_test');
const NoAttributeTest = require('./no_attribute_test');
const InitialDataTest = require('./initial_data_test');
const MeAttributesTest = require('./me_attributes_test');
const NoLoginUnregisteredTest = require('./no_login_unregistered_test');
const NoPasswordTest = require('./no_password_test');
const UnregisteredInvalidPasswordTest = require('./unregistered_invalid_password_test');
const NewTokenTest = require('./new_token_test');
const TokenIsValidTest = require('./token_is_valid_test');
const SubscriptionTest = require('./subscription_test');
const DontUpdateLastLoginFromWebTest = require('./dont_update_last_login_from_web_test');
const ClearFirstSessionTest = require('./clear_first_session_test');
const SubscriptionToObjectByMentionTest = require('./subscription_to_object_by_mention_test');
const SubscriptionToObjectByCreationTest = require('./subscription_to_object_by_creation_test');
const SubscriptionToObjectByMentionOtherTeamTest = require('./subscription_to_object_by_mention_other_team_test');

class LoginRequestTester {

	loginTest () {
		new LoginTest().test();
		new NoAttributeTest({ attribute: 'email' }).test();
		new NoAttributeTest({ attribute: 'password' }).test();
		new InvalidPasswordTest().test();
		new InvalidEmailTest().test();
		new InitialDataTest().test();
		new MeAttributesTest().test();
		new NoLoginUnregisteredTest().test();
		new NoPasswordTest().test();
		new UnregisteredInvalidPasswordTest().test();
		new NewTokenTest().test();
		new TokenIsValidTest().test();
		new SubscriptionTest({ which: 'user' }).test();
		new SubscriptionTest({ which: 'team' }).test();
		// new SubscriptionTest({ which: 'stream' }).test(); // subscription to stream channels is deprecated
		new DontUpdateLastLoginFromWebTest().test();
		new ClearFirstSessionTest().test();
		//new SubscriptionToObjectByMentionTest().test();
		//new SubscriptionToObjectByCreationTest().test();
		//new SubscriptionToObjectByMentionOtherTeamTest().test();
	}
}

module.exports = LoginRequestTester;
