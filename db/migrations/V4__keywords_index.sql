CREATE INDEX keywords_index ON fingerpost_wire_entry
    USING GIN ((content -> 'keywords') jsonb_path_ops)
