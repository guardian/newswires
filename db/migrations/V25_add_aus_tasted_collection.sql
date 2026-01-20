DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM collection  
      WHERE name = 'Tasted (AUS)'
   ) THEN
    INSERT INTO collection (name, description)
        VALUES ('Tasted (AUS)', 'Collection for Tasted wire entries for Australia desks');
   END IF;
END
$do$;