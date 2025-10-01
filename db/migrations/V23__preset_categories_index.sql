DROP INDEX IF EXISTS preset_categories_index;
CREATE INDEX IF NOT EXISTS preset_categories_index ON fingerpost_wire_entry USING GIN(preset_categories);