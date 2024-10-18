-- Supplement the existing keywords_index which uses jsonb_path_ops.
-- jsonb_path_ops can be used by queries using @> operator,
-- but cannot be used by they "key-exists operators" ?, ?| and ?&.
-- We might decide to remove the jsonb_path_ops index in the future,
-- as these are somewhat duplicated indexes, but the docs do
-- suggest that a jsonb_path_ops index is more performant.

CREATE INDEX keywords_nonpath_index ON fingerpost_wire_entry
    USING GIN ((content -> 'keywords') jsonb_ops);
