import serverlessExpress from '@vendia/serverless-express';
import type { Handler as LambdaHandler } from 'aws-lambda';
import router from './router';
import { server } from './server';

export const handler: LambdaHandler = serverlessExpress({
	app: server(router),
});
