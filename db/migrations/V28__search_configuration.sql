CREATE EXTENSION unaccent;

CREATE TEXT SEARCH CONFIGURATION english_unaccent ( COPY = english );

ALTER TEXT SEARCH CONFIGURATION english_unaccent
ALTER MAPPING FOR hword, hword_part, word
WITH unaccent, english_stem;