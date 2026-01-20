-- Add unique constraint to collection name. 'IF NOT EXISTS' is not supported for constraints, so we use a DO block to check first.
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_constraint  
      WHERE conname = 'unique_collection_name'
      AND contype = 'u'
      AND conrelid = 'collection'::regclass
   ) THEN
      ALTER TABLE collection
        ADD CONSTRAINT unique_collection_name UNIQUE (name);
   END IF;
END
$do$;