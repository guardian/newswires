ALTER TABLE fingerpost_wire_entry ADD COLUMN precomputed_categories text[];
CREATE INDEX IF NOT EXISTS precomputed_categories_index ON fingerpost_wire_entry USING GIN(precomputed_categories);