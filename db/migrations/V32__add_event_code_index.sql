CREATE INDEX CONCURRENTLY agency_event_code_idx ON fingerpost_wire_entry
  USING GIN ((content->'agencyMetadata'->'event'-> 0 ->>'code') gin_trgm_ops);  