CREATE TABLE line_items (
  id BIGSERIAL PRIMARY KEY,
  -- Polymorphic relationship: belongs to either estimate or invoice
  estimate_id BIGINT REFERENCES estimates(id) ON DELETE CASCADE,
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
  -- Ensure exactly one parent is set
  CONSTRAINT check_one_parent CHECK (
    (estimate_id IS NOT NULL AND invoice_id IS NULL) OR
    (estimate_id IS NULL AND invoice_id IS NOT NULL)
  ),
  item_type TEXT NOT NULL CHECK (item_type IN ('labor', 'material', 'other')),
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_line_items_estimate_id ON line_items(estimate_id);
CREATE INDEX idx_line_items_invoice_id ON line_items(invoice_id);
CREATE INDEX idx_line_items_sort_order ON line_items(sort_order);
