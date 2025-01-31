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
	error: (line: LogLine) => void;
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
		error: (line: LogLine) => {
			console.error(JSON.stringify({ ...defaultFields, ...line }));
		},
	};
}
