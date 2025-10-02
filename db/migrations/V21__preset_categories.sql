ALTER TABLE fingerpost_wire_entry ADD COLUMN preset_categories text[];
CREATE INDEX IF NOT EXISTS preset_categories_index ON fingerpost_wire_entry(preset_categories);