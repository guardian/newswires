CREATE TABLE tool_link (
  id BIGSERIAL PRIMARY KEY,
  wire_id BIGINT NOT NULL,
  tool TEXT NOT NULL,
  sent_by TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ref TEXT);

CREATE INDEX tool_link_wire_id_idx ON tool_link (wire_id);

-- backfill existing composer links into new table
INSERT INTO tool_link (wire_id, tool, sent_by, sent_at, ref)
  SELECT id, 'composer', composer_sent_by,
    -- We don't know when the existing wire was sent to Composer, so
    -- use ingested_at date as the earliest time it could have been sent.
    ingested_at,
    -- The migration script is not stage aware, so use PROD-style urls
    -- and live with minor breakage on CODE.
    'https://composer.gutools.co.uk/content/' || composer_id
  FROM fingerpost_wire_entry
  WHERE composer_id IS NOT NULL AND composer_sent_by IS NOT NULL;
