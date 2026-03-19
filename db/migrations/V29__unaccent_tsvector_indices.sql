CREATE INDEX CONCURRENTLY combined_textsearch_accent_idx
ON fingerpost_wire_entry
USING GIN (
  to_tsvector(
    'english_unaccent',
    coalesce(content->>'headline', '') || ' ' ||
    coalesce(content->>'subhead', '') || ' ' ||
    coalesce(content->>'keywords', '') || ' ' ||
    coalesce(content->>'body_text', '') || ' ' ||
    coalesce(content->>'byline', '') || ' ' ||
    coalesce(content->>'abstract', '') || ' ' ||
    coalesce(content->>'slug', '')
  )
);
