CREATE INDEX mediaCatCodes_index ON fingerpost_wire_entry
    USING GIN ((content -> 'mediaCatCodes') jsonb_ops);


UPDATE fingerpost_wire_entry
SET content = jsonb_set(
    content,
    '{mediaCatCodes}',
    to_jsonb(string_to_array(content ->> 'mediaCatCodes', '+')),
    true
)
WHERE jsonb_typeof(content -> 'mediaCatCodes') = 'string';
