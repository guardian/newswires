ALTER TABLE fingerpost_wire_entry
    ADD supplier VARCHAR(255);

CREATE INDEX supplier_index ON fingerpost_wire_entry(supplier);
