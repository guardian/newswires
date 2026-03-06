ALTER TABLE fingerpost_wire_entry
    ADD source_feed TEXT;

-- Named toplevel to distinguish from the index on content->>'source-feed';
CREATE INDEX toplevel_source_feed_index ON fingerpost_wire_entry(lower(source_feed));
