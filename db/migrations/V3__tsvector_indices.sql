ALTER TABLE fingerpost_wire_entry
  ADD COLUMN combined_textsearch tsvector
    GENERATED ALWAYS AS (to_tsvector('english',
        coalesce(content->>'headline', '') || ' ' ||
        coalesce(content->>'subhead', '') || ' ' ||
        coalesce(content->>'keywords', '') || ' ' ||
        coalesce(content->>'body_text', '')
    )) STORED;

CREATE INDEX combined_textsearch_idx ON fingerpost_wire_entry
  USING GIN (combined_textsearch);
