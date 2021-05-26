
const getProductType = require('./get_onprem_support_data').getProductType;
const mongoUrlParser = require('./mongo/mongo_url_parser');
const mongoUrlAssembler = require('./mongo/mongo_url_assembler');

var OnPremProductType;
if (!OnPremProductType) OnPremProductType = getProductType();

const determineInternalHost = (onPremProductType, service) => {
	// on docker-compose bridge networks, container names serve as hostnames
	const internalNetworkHostNames = {
		api: 'csapi',
		broadcaster: 'csbcast',
		mailout: 'csmailout',
		mongo: 'csmongo',
		rabbitmq: 'csrabbitmq',
		admin: 'csadmin',
	};
	return onPremProductType === 'Single Linux Host'
		? 'localhost'
		: onPremProductType === 'Single Mac Host'
		? 'host.docker.internal'
		: onPremProductType === 'Docker Compose'
		? internalNetworkHostNames[service]
		: // onPremProductType === 'On-Prem Development'
		  'localhost';
};


const removeAssetEnvironment = (cfg) => {
	// assetEnvironment is no longer a config property
	if ('assetEnvironment' in cfg.apiServer) {
		delete cfg.apiServer.assetEnvironment;
	}
	if ('codestreamBroadcaster' in cfg.broadcastEngine && 'assetEnvironment' in cfg.broadcastEngine.codestreamBroadcaster) {
		delete cfg.broadcastEngine.codestreamBroadcaster.assetEnvironment;
	}
	if ('outboundEmailServer' in cfg && 'assetEnvironment' in cfg.outboundEmailServer) {
		delete cfg.outboundEmailServer.assetEnvironment;
	}
	if ('inboundEmailServer' in cfg && 'assetEnvironment' in cfg.inboundEmailServer) {
		delete cfg.inboundEmailServer.assetEnvironment;
	}
}

const from15To16 = (nativeCfg, from, to, logger) => {
	logger.log('migrating from schema version 15 to 16...');
	removeAssetEnvironment(nativeCfg);
	// modify the config in some way
	// return X; // return a new object if you want to replace nativeCfg
};

const from17To18 = (nativeCfg) => {
	console.log('migrating from schema 17 to 18...');
	// modify the config in some way
	// return X; // return a new object if you want to replace nativeCfg
};

// Support for docker bridged networks (docker-compose) requires internal
// hostnames for the api, broadcaster, ...
const from18To19 = (nativeCfg) => {
	console.log('migrating from schema 18 to 19...');
	if (!process.env.CSSVC_CFG_URL) {
		console.error('FATAL: CSSVC_CFG_URL undefined');
		process.exit(1);
	}
	if (nativeCfg.apiServer) {
		if ('altBroadcasterHost' in nativeCfg.apiServer) delete nativeCfg.apiServer.altBroadcasterHost;
		if ('securePort' in nativeCfg.apiServer) delete nativeCfg.apiServer.securePort;
		if (!nativeCfg.apiServer.internalHost)
			nativeCfg.apiServer.internalHost = determineInternalHost(OnPremProductType, 'api');
	}
	if ('codestreamBroadcaster' in nativeCfg.broadcastEngine) {
		if ('altApiHost' in nativeCfg.broadcastEngine.codestreamBroadcaster)
			delete nativeCfg.broadcastEngine.codestreamBroadcaster.altApiHost;
		if (!nativeCfg.broadcastEngine.codestreamBroadcasterinternalHost)
			nativeCfg.broadcastEngine.codestreamBroadcaster.internalHost = determineInternalHost(OnPremProductType, 'broadcaster');
	}
	if (nativeCfg.emailDeliveryService && nativeCfg.emailDeliveryService.NodeMailer) {
		if (!nativeCfg.emailDeliveryService.NodeMailer.internalHost)
			nativeCfg.emailDeliveryService.NodeMailer.internalHost = determineInternalHost(OnPremProductType, 'mailout');
	}
	if (nativeCfg.adminServer && !nativeCfg.adminServer.internalHost) {
		nativeCfg.adminServer.internalHost = determineInternalHost(OnPremProductType, 'admin');
	}
	if (nativeCfg.queuingEngine && nativeCfg.queuingEngine.rabbitmq) {
		nativeCfg.queuingEngine.rabbitmq.host = determineInternalHost(OnPremProductType, 'rabbitmq');
	}
	if (nativeCfg.storage && nativeCfg.storage.mongo) {
		// this variable is required for all on-prem product types. The config
		// value doesn't really apply but setting it to the same value ensures
		// no config alerts are raised later.
		if (process.env.CSSVC_CFG_URL) nativeCfg.storage.mongo.url = process.env.CSSVC_CFG_URL;
	}
}

// sequence matters!
const MigrationMatrix = [
	// [from-schema, to-schema, migrationFunc]
	[15, 16, from15To16],
	[17, 18, from17To18],
	[18, 19, from18To19],
];

module.exports = MigrationMatrix;
