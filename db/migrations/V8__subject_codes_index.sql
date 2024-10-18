CREATE INDEX subject_codes_index ON fingerpost_wire_entry
  USING GIN ((content->'subjects'->'code') jsonb_ops);
