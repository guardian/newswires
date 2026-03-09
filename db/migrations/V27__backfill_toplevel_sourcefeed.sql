-- backfill the gu_source_feed column with values from
-- content->>'source-feed'.
-- We want to do this without overly blocking other writes
DO
$do$
DECLARE remaining INT := 0;
BEGIN
  SELECT count(1) INTO remaining
  FROM fingerpost_wire_entry
  WHERE upper(gu_source_feed) IS NULL
    AND upper(content->>'source-feed') IS NOT NULL;

  WHILE remaining > 0 LOOP
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
