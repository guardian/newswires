CREATE INDEX CONCURRENTLY IF NOT EXISTS fingerpost_wire_entry_ingested_at_dataformat_idx
ON public.fingerpost_wire_entry (ingested_at DESC)
WHERE ((content -> 'dataformat'::text) IS NOT NULL);