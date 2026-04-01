CREATE TEXT SEARCH CONFIGURATION simple_unaccent ( COPY = simple );

ALTER TEXT SEARCH CONFIGURATION simple_unaccent
ALTER MAPPING FOR hword, hword_part, word
WITH unaccent, simple;