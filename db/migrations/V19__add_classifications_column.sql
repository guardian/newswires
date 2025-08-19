ALTER TABLE fingerpost_wire_entry
    ADD COLUMN IF NOT EXISTS classifications text[];

CREATE INDEX IF NOT EXISTS classifications_index ON fingerpost_wire_entry(classifications);