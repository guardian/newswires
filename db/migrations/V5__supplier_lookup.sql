CREATE TABLE source_feed_to_supplier (
  source_feed TEXT NOT NULL,
  supplier TEXT NOT NULL,

  PRIMARY KEY(source_feed, supplier)
);
