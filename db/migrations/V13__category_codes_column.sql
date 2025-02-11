ALTER TABLE fingerpost_wire_entry
    ADD category_codes text[];

CREATE INDEX category_codes_index ON fingerpost_wire_entry(category_codes);
