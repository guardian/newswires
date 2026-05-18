import { v4 as uuidv4 } from 'uuid';

/** Just a simple wrapper around uuidv4 to make it easier to mock in tests.
 * Avoids the test setup needing to know about the internal implementation of fetchResults.
 */
export function generateRequestId(): string {
	return uuidv4();
}
