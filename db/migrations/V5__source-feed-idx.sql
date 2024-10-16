CREATE INDEX source_feed_idx
ON fingerpost_wire_entry (upper(content->>'source-feed'));
