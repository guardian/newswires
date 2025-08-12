ALTER TABLE fingerpost_wire_entry
    ADD COLUMN IF NOT EXISTS s3_key text;