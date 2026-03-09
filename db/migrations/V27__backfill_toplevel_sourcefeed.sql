-- backfill the gu_source_feed column with values from
-- content->>'source-feed'.
-- We want to do this without overly blocking other writes
DO
$do$
DECLARE remaining INT := 0;
BEGIN
  -- email content has written source-feed to sourceFeed by accident so far
  -- fixed in https://github.com/guardian/newswires/pull/728/changes#diff-17271d56b3c81a84b69d8f3b1ed4da249abe92ba953421560ffb904f478c4b21R33
  -- rewrite it to source-feed so it's where we expect it to be
  UPDATE fingerpost_wire_entry
  -- delete content->sourceFeed, and set content->source-feed to its previous value
  SET content = jsonb_set(
    content - 'sourceFeed',
    '{source-feed}',
    content->'sourceFeed'
  )
  WHERE content->>'sourceFeed' IS NOT NULL
    AND content->>'source-feed' IS NULL;

  COMMIT;

  -- now count how many items need source-feed copying to top-level
  SELECT count(1) INTO remaining
  FROM fingerpost_wire_entry
  WHERE upper(gu_source_feed) IS NULL
    AND upper(content->>'source-feed') IS NOT NULL;

  WHILE remaining > 0 LOOP
    -- copy in batches of 5000
    UPDATE fingerpost_wire_entry
    SET gu_source_feed = content->>'source-feed'
    WHERE id IN (
      SELECT id
      FROM fingerpost_wire_entry
      WHERE upper(gu_source_feed) IS NULL
        AND upper(content->>'source-feed') IS NOT NULL
      LIMIT 5000
    );

    COMMIT;

    remaining := remaining - 5000;
  END LOOP;
END
$do$;
