import serverlessExpress from '@vendia/serverless-express';
import type { Handler as LambdaHandler } from 'aws-lambda';
import { server } from './server';
import router from './router';

export const handler: LambdaHandler = serverlessExpress({
	app: server(router),
});