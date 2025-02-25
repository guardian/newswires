interface LogLine {
	/**
	 * The message to log.
	 */
	message: string;
	/**
	 * Any additional markers to log.
	 */
	[key: string]: unknown;
}

export interface Logger {
	log: (line: LogLine) => void;
	debug: (line: LogLine) => void;
	warn: (line: LogLine) => void;
	error: (line: LogLine, error: unknown) => void;
}

/**
 * Produces a log message with markers compatible with https://github.com/guardian/cloudwatch-logs-management.
 * Note: if using within AWS Lambda, the Lambda must also log in text format not JSON.
 *
 * @see https://github.com/guardian/cloudwatch-logs-management/issues/326
 */
export function createLogger(defaultFields: Omit<LogLine, 'message'>): Logger {
	return {
		log: (line: LogLine) => {
			console.log(JSON.stringify({ ...defaultFields, ...line }));
		},
		debug: (line: LogLine) => {
			console.debug(JSON.stringify({ ...defaultFields, ...line }));
		},
		warn: (line: LogLine) => {
			console.warn(JSON.stringify({ ...defaultFields, ...line }));
		},
		error: (line: LogLine, error: unknown) => {
			console.error(
				JSON.stringify({
					...defaultFields,
					error: { ...getErrorMessage(error) },
					...line,
				}),
			);
		},
	};
}

/**
 * Error parsing utilities, adapted from:
 * https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
 */
type ErrorWithMessage = {
	message: string;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
	return (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as Record<string, unknown>).message === 'string'
	);
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
	if (isErrorWithMessage(maybeError)) return maybeError;

	try {
		return new Error(JSON.stringify(maybeError));
	} catch {
		// fallback in case there's an error stringifying the maybeError
		// like with circular references for example.
		return new Error(String(maybeError));
	}
}

function getErrorMessage(error: unknown) {
	return toErrorWithMessage(error);
}
