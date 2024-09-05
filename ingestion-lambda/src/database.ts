export const tableName = 'fingerpost_wire_entry';

export interface WireEntry {
	external_id: string;
	content: Record<string, unknown>;
}
