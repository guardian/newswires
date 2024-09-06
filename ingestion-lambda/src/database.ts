export const tableName = 'fingerpost_message';

export interface WireEntry {
	external_id: string;
	content: Record<string, unknown>;
}
