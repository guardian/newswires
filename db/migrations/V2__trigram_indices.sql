-- Adding indexes to support the initial, pg_trgm based search filters.
-- These should almost certainly only be temporary, and be replaced with
-- indexes for tsvector based searches soon...

CREATE INDEX headline_trgm_index ON fingerpost_wire_entry
  USING GIN ((content->>'headline') gin_trgm_ops);

CREATE INDEX subhead_trgm_index ON fingerpost_wire_entry
  USING GIN ((content->>'subhead') gin_trgm_ops);

CREATE INDEX keywords_trgm_index ON fingerpost_wire_entry
  USING GIN ((content->>'keywords') gin_trgm_ops);

CREATE INDEX byline_trgm_index ON fingerpost_wire_entry
  USING GIN ((content->>'byline') gin_trgm_ops);

CREATE INDEX body_text_trgm_index ON fingerpost_wire_entry
  USING GIN ((content->>'body_text') gin_trgm_ops);
