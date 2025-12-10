CREATE TABLE IF NOT EXISTS collection (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wire_entry_collection (
    id BIGSERIAL PRIMARY KEY,
    wire_entry_id BIGINT NOT NULL REFERENCES fingerpost_wire_entry(id) ON DELETE CASCADE,
    collection_id BIGINT NOT NULL REFERENCES collection(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    added_by TEXT,
    UNIQUE (collection_id, wire_entry_id)
);

-- Index for querying all collections for a given wire entry
CREATE INDEX IF NOT EXISTS idx_wire_entry_collection_wire_entry_id 
ON wire_entry_collection(wire_entry_id);