CREATE INDEX source_feed_idx
ON fingerpost_wire_entry ((content->>'source-feed'));
