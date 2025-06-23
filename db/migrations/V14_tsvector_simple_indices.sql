ALTER TABLE fingerpost_wire_entry
    ADD COLUMN headline_tsv_simple tsvector
        GENERATED ALWAYS AS (to_tsvector('simple', lower(coalesce(content ->> 'headline', '')))) STORED;

ALTER TABLE fingerpost_wire_entry
    ADD COLUMN body_text_tsv_simple tsvector
        GENERATED ALWAYS AS (to_tsvector('simple', lower(coalesce(content ->> 'body_text', '')))) STORED;

CREATE INDEX headline_tsv_simple_idx ON fingerpost_wire_entry
    USING GIN (headline_tsv_simple);

CREATE INDEX body_text_tsv_simple_idx ON fingerpost_wire_entry
    USING GIN (body_text_tsv_simple);
