import { api } from "encore.dev/api";
import db from "../db";
import type { Estimate, LineItem } from "./types";

export interface UpdateEstimateRequest {
  id: number;
  title?: string;
  description?: string;
  taxRate?: number;
  validUntil?: string;
  notes?: string;
  lineItems?: Omit<LineItem, "id">[];
}

// Update an estimate and optionally replace line items
export const update = api<UpdateEstimateRequest, Estimate>(
  { expose: true, method: "PUT", path: "/estimates/:id" },
  async (req) => {
    // Check estimate exists and is editable (not approved)
    const existing = await db.queryRow<{ status: string }>`
      SELECT status FROM estimates WHERE id = ${req.id}
    `;

    if (!existing) {
      throw new Error("Estimate not found");
    }

    if (existing.status === "approved") {
      throw new Error("Cannot update approved estimate");
    }

    // Update each field conditionally
    if (req.title !== undefined) {
      await db.exec`UPDATE estimates SET title = ${req.title}, updated_at = NOW() WHERE id = ${req.id}`;
    }

    if (req.description !== undefined) {
      await db.exec`UPDATE estimates SET description = ${req.description}, updated_at = NOW() WHERE id = ${req.id}`;
    }

    if (req.validUntil !== undefined) {
      await db.exec`UPDATE estimates SET valid_until = ${req.validUntil}, updated_at = NOW() WHERE id = ${req.id}`;
    }

    if (req.notes !== undefined) {
      await db.exec`UPDATE estimates SET notes = ${req.notes}, updated_at = NOW() WHERE id = ${req.id}`;
    }

    // If line items are provided, recalculate totals and replace line items
    if (req.lineItems && req.lineItems.length > 0) {
      const subtotal = req.lineItems.reduce((sum, item) => sum + item.total, 0);
      const taxRate = req.taxRate ?? 0;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      // Update totals
      await db.exec`
        UPDATE estimates
        SET subtotal = ${subtotal},
            tax_rate = ${taxRate},
            tax_amount = ${taxAmount},
            total = ${total},
            updated_at = NOW()
        WHERE id = ${req.id}
      `;

      // Delete existing line items
      await db.exec`DELETE FROM line_items WHERE estimate_id = ${req.id}`;

      // Insert new line items
      for (const item of req.lineItems) {
        await db.exec`
          INSERT INTO line_items (
            estimate_id, item_type, description, quantity, unit_price, total, sort_order
          )
          VALUES (
            ${req.id}, ${item.itemType}, ${item.description},
            ${item.quantity}, ${item.unitPrice}, ${item.total}, ${item.sortOrder}
          )
        `;
      }
    }

    // Fetch updated estimate
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
      SELECT id, customer_id, estimate_number, status, title, description,
             subtotal, tax_rate, tax_amount, total, valid_until, notes,
             created_at, updated_at, sent_at, approved_at
      FROM estimates
      WHERE id = ${req.id}
    `;

    if (!estimate) {
      throw new Error("Failed to fetch updated estimate");
    }

    // Get line items
    const lineItemRows = await db.query<{
      id: number;
      item_type: string;
      description: string;
      quantity: string;
      unit_price: string;
      total: string;
      sort_order: number;
    }>`
      SELECT id, item_type, description, quantity, unit_price, total, sort_order
      FROM line_items
      WHERE estimate_id = ${req.id}
      ORDER BY sort_order ASC
    `;

    // Ensure lineItemRows is always an array
    const lineItemsArray = Array.isArray(lineItemRows) ? lineItemRows : [];

    const lineItems: LineItem[] = lineItemsArray.map((item) => ({
      id: item.id,
      itemType: item.item_type as "labor" | "material" | "other",
      description: item.description,
      quantity: parseFloat(item.quantity),
      unitPrice: parseFloat(item.unit_price),
      total: parseFloat(item.total),
      sortOrder: item.sort_order,
    }));

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
