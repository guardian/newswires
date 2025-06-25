ALTER TABLE fingerpost_wire_entry
    ADD COLUMN headline_tsv_simple tsvector
        GENERATED ALWAYS AS (to_tsvector('simple', lower(coalesce(content ->> 'headline', '')))) STORED;

CREATE INDEX headline_tsv_simple_idx ON fingerpost_wire_entry
    USING GIN (headline_tsv_simple);
