ALTER TABLE fingerpost_wire_entry
    ADD COLUMN slug_text_tsv_simple tsvector
        GENERATED ALWAYS AS (to_tsvector('simple', lower(coalesce(content ->> 'slug', '')))) STORED;

CREATE INDEX slug_text_tsv_simple_idx ON fingerpost_wire_entry
    USING GIN (slug_text_tsv_simple);