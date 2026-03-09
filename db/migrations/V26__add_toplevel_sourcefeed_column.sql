ALTER TABLE fingerpost_wire_entry
    ADD gu_source_feed TEXT;

CREATE INDEX gu_source_feed_index ON fingerpost_wire_entry(upper(gu_source_feed));
