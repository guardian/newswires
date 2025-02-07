-- alter the main table to add columns that can store the composer ID of a generated piece
ALTER TABLE fingerpost_wire_entry
  ADD COLUMN composer_id TEXT NULL,
  ADD COLUMN composer_sent_by TEXT NULL;
