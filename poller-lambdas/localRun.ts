import { apPoller } from './src/pollers/AP/apPoller';

const secret = process.env.AP_API_KEY;

if (!secret) {
	console.error('Missing AP_API_KEY environment variable');
	process.exit(1);
}

apPoller(secret, undefined).then(console.log).catch(console.error);
