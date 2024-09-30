CREATE INDEX mediaCatCodes_index ON fingerpost_wire_entry
    USING GIN ((content -> 'mediaCatCodes') jsonb_path_ops)
