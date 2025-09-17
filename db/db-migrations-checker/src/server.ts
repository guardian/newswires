import type { Express, RequestHandler, Router } from 'express';
import { default as express, json } from 'express';

const createServer = (router: Router): Express => {
	const server: Express = express();
	server.use(json()) as RequestHandler;
	server.use(router);
	return server;
};

export const server: (router: Router) => Express = (router) =>
	createServer(router);
