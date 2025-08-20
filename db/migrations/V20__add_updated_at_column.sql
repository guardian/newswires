ALTER TABLE fingerpost_wire_entry
    ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE;
    
CREATE INDEX IF NOT EXISTS last_updated_at_index ON fingerpost_wire_entry(last_updated_at);