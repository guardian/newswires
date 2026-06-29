/** Just a simple wrapper around node's uuid implementation to make it easier to mock in tests.
 * Avoids the test setup needing to know about the internal implementation of fetchResults.
 */
export function generateRequestId(): string {
	return crypto.randomUUID();
}
