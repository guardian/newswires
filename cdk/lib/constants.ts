import * as lambda from 'aws-cdk-lib/aws-lambda';

export const LAMBDA_RUNTIME = lambda.Runtime.NODEJS_22_X;
export const LAMBDA_ARCHITECTURE = lambda.Architecture.ARM_64;

export const app = 'newswires';
