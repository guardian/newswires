/**
 * Is this application running locally, or in AWS?
 * LAMBDA_TASK_ROOT & AWS_EXECUTION_ENV are set when running in AWS
 * See: https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
 */
export const isRunningLocally =
	!process.env.LAMBDA_TASK_ROOT && !process.env.AWS_EXECUTION_ENV;

// We use localstack to mock AWS services if we are running locally.
export const awsOptions = isRunningLocally
	? {
			endpoint: 'http://localhost:4566',
			region: 'eu-west-1',
			forcePathStyle: true,
			credentials: {
				accessKeyId: '',
				secretAccessKey: '',
			},
		}
	: {};
