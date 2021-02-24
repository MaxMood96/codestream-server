'use strict';

import Express from 'express';
import Passport from 'passport';
import { Logger, MongoStructuredConfig, AdminConfig, SystemStatusMonitor, MongoClient } from '../config/globalData';
import AdminAccess from '../lib/adminAccess';
import GetAssetData from '../../shared/server_utils/get_asset_data';

const ApiRouter = Express.Router();

// -----------------
// ----------------- no-auth routes
// -----------------
ApiRouter.get('/no-auth/asset-info', async (req, res) => {
	res.send(await GetAssetData());
});

ApiRouter.get('/no-auth/status', (req, res) => {
	res.send('OK');
});


// -----------------
// ----------------- Login & Registration
// -----------------
// FIXME: we need the password to get encrypted (or hashed) on the client so
// we never send an unenrypted password over http.
ApiRouter.post('/no-auth/login', (req, res, next) => {
	Logger.log('/no-auth/login', req.body);
	Passport.authenticate('local', (err, user, info) => {
		Logger.log('Inside passport.authenticate() callback - BEFORE login()');
		Logger.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`);
		// Logger.log(`req.user: ${JSON.stringify(req.user)}`);
		Logger.log('req.user:', req.user);
		if (info) {
			// we failed to auth with a reason (bad user or pass)
			Logger.log(`passport.auth failed. info`, info);
			return res.send(info.message);
		}
		if (err) {
			// propogate an error condition down the line
			return next(err);
		}
		if (!user) {
			// posted a form w/o a user ??  when could this happen??
			Logger.log('NOT user - redirecting to /login');
			return res.send({ loggedIn: false });
		}
		// passport.authenticate() added login() func to the req object
		req.login(user, (err) => {
			// login() serializes the user id to the session store and inside the
			// req obj. It also adds the user obj to our req obj as req.user.
			// Logger.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`);
			// Logger.log(`req.user: ${JSON.stringify(req.user)}`);
			if (err) {
				return next(err);
			}
			Logger.log('req.login() we are authenticated');
			return res.send({ loggedIn: true, profile: { id: user.id, email: user.email } });
		})
	})(req, res, next);
});

ApiRouter.post('/no-auth/register', async (req, res) => {
	Logger.log('/no-auth/register', req.body.email);
	if (req.body.id !== 'root' || !req.body.email || !req.body.password) {
		res.status(400).send({success: false, message: 'bad data sent' })
	}
	const adminAccess = new AdminAccess(MongoClient, { logger: Logger });
	try {
		if (!await adminAccess.store(req.body)) {
			const msg = `attempt to register ${req.body.email} store method failed`;
			Logger.error(msg);
			res.status(400).send({ success: false, message: msg });
		}
	}
	catch (error) {
		const msg = `attempt to register ${req.body.email} failed with ${error}`;
		Logger.error(msg);
		res.status(400).send({success: false, message: msg });
	}
	Logger.log(`user ${req.body.id} with email ${req.body.email} registered successfully`);
	res.redirect(307, '/api/no-auth/login');
});


// -----------------
// ----------------- license data
// -----------------

// a list of unique license plans found across the entire companies collection
ApiRouter.get('/licenses', async (req, res) => {
	Logger.log(`api(get):/licenses`);
	const licenseData = await MongoClient.db()
		.collection('companies')
		.find({ plan: { $exists: true } })
		.sort({ plan: -1 })
		.toArray();
	const licenses = {};
	let isTrial = false;
	// let isExpired = false;
	licenseData.forEach(company => {
		const thisLicense = company.plan === '14DAYTRIAL' ? 'TRIAL' : company.plan;
		licenses[thisLicense] = 1;
		if (thisLicense.match(/trial/i)) isTrial = true;
	});
	// the license doesn't get added to the database until after the first codemark
	// is created so we assume a 14DAYTRIAL license for a pre-used database.
	// if (!Object.keys(licenses).length) licenses.push('14DAYTRIAL');
	if (!Object.keys(licenses).length) licenses.push('TRIAL');
	res.send({ licenses: Object.keys(licenses), isTrial });
});


// -----------------
// ----------------- configuration related
// -----------------

// list of config meta docs
ApiRouter.get('/config/summary/:schemaVersion?', async (req, res) => {
	Logger.log(`api(get):/config/summary/${req.params.schemaVersion})`);
	res.send(await MongoStructuredConfig.getConfigSummary({schemaVersion: req.params.schemaVersion}));
});

// activate a configuration by serial number
ApiRouter.put('/config/activate/:serialNumber', async (req, res) => {
	Logger.log(`api(put):/config/activate/${req.params.serialNumber})`);
	if (await MongoStructuredConfig.activateMongoConfig(req.params.serialNumber)) {
		res.send('true');
	}
	else {
		res.status(400).send('false');
	}
});

// add a new config to the database and optionally activate it (set to '1' or 'true')
// FIXME: is it necessary to validate the body before writing to mongo??
ApiRouter.post('/config/:activate?', async (req, res) => {
	Logger.log(`api(post):/config/${req.params.activate}`);
	const activate = req.params.activate in ['1', 'true', 'activate'];
	const configDoc = await MongoStructuredConfig.addNewConfigToMongo(req.body.configData, { desc: req.body.desc });
	if (!configDoc) {
		Logger.error(`Add new config failed`, req.body);
		res.status(404).send({success: false, reason: "Failed to add config to database"});
		return;
	}
	Logger.log(`added new config ${configDoc.serialNumber}`);
	if (activate) {
		if (!await MongoStructuredConfig.activateMongoConfig(configDoc.serialNumber)) {
			res.status(404).send({success: false, reason: `Failed to activate config ${serialNumber}`});
			return;
		}
		Logger.log(`activated cibfug ${configDoc.serialNumber}`);
	}
	res.send({success: true, response: { configDoc }});
});

// delete configuration by serial number
ApiRouter.delete('/config/:serialNumber', async (req, res) => {
	Logger.log(`api(delete):/config/${req.params.serialNumber}`);
	if (await MongoStructuredConfig.deleteConfigFromMongo(req.params.serialNumber)) {
		res.send('true');
	}
	else {
		res.status(404).send('false');
	}
});

// fetch a configuration by serial number
ApiRouter.get('/config/:serialNumber', async (req, res) => {
	Logger.log(`api(get):/config/${req.params.serialNumber}`);
	let config;
	if (req.params.serialNumber === 'active') {
		// provide the config and related data that would have been present
		// in the initial state had the user been authorized when making the
		// initial request
		config = {
			configData: AdminConfig.getNativeConfig(),
			activeConfigSerialNumber: MongoStructuredConfig.getConfigMetaDocument().serialNumber,
			codeSchemaVersion: AdminConfig.getSchemaVersion(), // schemaVersion of the code base
			runningRevision: AdminConfig.getConfigType() === 'mongo' ? AdminConfig.getConfigMetaDocument().revision : null, // config rev of running server (null for file)
		};
	}
	else {
		config = await MongoStructuredConfig.getConfigBySerial(req.params.serialNumber, { includeMetaData: true });
	}
	if (config) {
		res.send(config);
	} else {
		res.status(404).send('false');
	}
});


// -----------------
// ----------------- user profiles
// -----------------

ApiRouter.get('/user/:userId', (req, res) => {
	Logger.log(`api(get):/user/${req.params.userId}`);
	if (!req.params.userId) {
		res.status(400).send('bad data');
	}
	else if (req.user.id !== req.params.userId) {
		res.status(400).send(`user ${req.user.id} does not get to see user ${req.params.userId}'s profile`);
	}
	else {
		// FIXME
		// lame!! since we only have 'root' we can simply assume our user profile is
		// part of the request object. Obviously it would be better if we actually
		// verified the request user matched the userId parm and passed the right
		// data back!
		res.send({ loggedIn: true, profile: { id: req.user.id, email: req.user.email } });
	}
});


// -----------------
// ----------------- system status
// -----------------

ApiRouter.get('/status/history', (req, res) => {
	Logger.log(`api(get):/status/history`);
	res.send(SystemStatusMonitor.statusHistory);
});

export default ApiRouter;
