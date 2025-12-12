import { api } from "encore.dev/api";
import db from "../db";
import type { Estimate, LineItem } from "./types";

export interface CreateEstimateRequest {
  customerId: number;
  title: string;
  description?: string;
  taxRate?: number;
  validUntil?: string; // ISO date string
  notes?: string;
  lineItems: Omit<LineItem, "id">[];
}

// Generate estimate number (simple incrementing format)
async function generateEstimateNumber(): Promise<string> {
  const result = await db.queryRow<{ count: number }>`
    SELECT COUNT(*) as count FROM estimates
  `;
  const count = result?.count ?? 0;
  return `EST-${String(count + 1).padStart(5, "0")}`;
}

// Creates a new estimate with line items
export const create = api<CreateEstimateRequest, Estimate>(
  { expose: true, method: "POST", path: "/estimates" },
  async (req) => {
    // Validate customer exists
    const customer = await db.queryRow`
      SELECT id FROM customers WHERE id = ${req.customerId}
    `;
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Validate line items
    if (!req.lineItems || req.lineItems.length === 0) {
      throw new Error("At least one line item is required");
    }

    // Calculate totals
    const subtotal = req.lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = req.taxRate ?? 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Generate estimate number
    const estimateNumber = await generateEstimateNumber();

    // Create estimate
    const estimate = await db.queryRow<{
      id: number;
      customer_id: number;
      estimate_number: string;
      status: string;
      title: string;
      description: string | null;
      subtotal: string;
      tax_rate: string;
      tax_amount: string;
      total: string;
      valid_until: string | null;
      notes: string | null;
      created_at: Date;
      updated_at: Date;
      sent_at: Date | null;
      approved_at: Date | null;
    }>`
      INSERT INTO estimates (
        customer_id, estimate_number, title, description,
        subtotal, tax_rate, tax_amount, total, valid_until, notes
      )
      VALUES (
        ${req.customerId}, ${estimateNumber}, ${req.title}, ${req.description ?? null},
        ${subtotal}, ${taxRate}, ${taxAmount}, ${total},
        ${req.validUntil ?? null}, ${req.notes ?? null}
      )
      RETURNING id, customer_id, estimate_number, status, title, description,
                subtotal, tax_rate, tax_amount, total, valid_until, notes,
                created_at, updated_at, sent_at, approved_at
    `;

    if (!estimate) {
      throw new Error("Failed to create estimate");
    }

    // Create line items
    const lineItems: LineItem[] = [];
    for (const item of req.lineItems) {
      const lineItem = await db.queryRow<{
        id: number;
        item_type: string;
        description: string;
        quantity: string;
        unit_price: string;
        total: string;
        sort_order: number;
      }>`
        INSERT INTO line_items (
          estimate_id, item_type, description, quantity, unit_price, total, sort_order
        )
        VALUES (
          ${estimate.id}, ${item.itemType}, ${item.description},
          ${item.quantity}, ${item.unitPrice}, ${item.total}, ${item.sortOrder}
        )
        RETURNING id, item_type, description, quantity, unit_price, total, sort_order
      `;

      if (lineItem) {
        lineItems.push({
          id: lineItem.id,
          itemType: lineItem.item_type as "labor" | "material" | "other",
          description: lineItem.description,
          quantity: parseFloat(lineItem.quantity),
          unitPrice: parseFloat(lineItem.unit_price),
          total: parseFloat(lineItem.total),
          sortOrder: lineItem.sort_order,
        });
      }
    }

    return {
      id: estimate.id,
      customerId: estimate.customer_id,
      estimateNumber: estimate.estimate_number,
      status: estimate.status as "draft" | "sent" | "approved" | "rejected",
      title: estimate.title,
      description: estimate.description,
      subtotal: parseFloat(estimate.subtotal),
      taxRate: parseFloat(estimate.tax_rate),
      taxAmount: parseFloat(estimate.tax_amount),
      total: parseFloat(estimate.total),
      validUntil: estimate.valid_until,
      notes: estimate.notes,
      createdAt: estimate.created_at,
      updatedAt: estimate.updated_at,
      sentAt: estimate.sent_at,
      approvedAt: estimate.approved_at,
      lineItems,
    };
  }
);
