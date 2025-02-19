ALTER TABLE fingerpost_wire_entry
    ADD COLUMN IF NOT EXISTS category_codes text[];

CREATE INDEX IF NOT EXISTS category_codes_index ON fingerpost_wire_entry(category_codes);
