CREATE TABLE tool_link (
  id BIGSERIAL PRIMARY KEY,
  wire_id BIGINT NOT NULL,
  tool TEXT NOT NULL,
  sent_by TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ref TEXT);

CREATE INDEX tool_link_wire_id_idx ON tool_link (wire_id);
