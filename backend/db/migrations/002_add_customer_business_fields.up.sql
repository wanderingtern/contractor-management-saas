-- Add business-related fields to customers for invoicing
ALTER TABLE customers ADD COLUMN business_name TEXT;
ALTER TABLE customers ADD COLUMN tax_id TEXT;
