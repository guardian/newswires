-- These indexes were added to support some initial, pg_trgm based
-- text searches. These have been replaces by the tsvector searches
-- in operation now.

DROP INDEX headline_trgm_index;

DROP INDEX subhead_trgm_index;

DROP INDEX keywords_trgm_index;

DROP INDEX byline_trgm_index;

DROP INDEX body_text_trgm_index;
