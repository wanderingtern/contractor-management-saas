CREATE TABLE photos (
  id BIGSERIAL PRIMARY KEY,
  -- Polymorphic relationship: can belong to customer, estimate, or invoice
  customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
  estimate_id BIGINT REFERENCES estimates(id) ON DELETE CASCADE,
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
  -- At least one parent must be set
  CONSTRAINT check_has_parent CHECK (
    customer_id IS NOT NULL OR estimate_id IS NOT NULL OR invoice_id IS NOT NULL
  ),
  url TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_customer_id ON photos(customer_id);
CREATE INDEX idx_photos_estimate_id ON photos(estimate_id);
CREATE INDEX idx_photos_invoice_id ON photos(invoice_id);
CREATE INDEX idx_photos_sort_order ON photos(sort_order);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
