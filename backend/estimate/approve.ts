import { api } from "encore.dev/api";
import db from "../db";
import type { Estimate } from "./types";

export interface ApproveEstimateRequest {
  id: number;
}

export interface ApproveEstimateResponse {
  estimate: Estimate;
  invoiceId: number; // ID of the created invoice
}

// Approve an estimate and convert it to an invoice
export const approve = api<ApproveEstimateRequest, ApproveEstimateResponse>(
  { expose: true, method: "POST", path: "/estimates/:id/approve" },
  async (req) => {
    // Get estimate
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
      throw new Error("Estimate not found");
    }

    if (estimate.status === "approved") {
      throw new Error("Estimate already approved");
    }

    // Update estimate status
    await db.exec`
      UPDATE estimates
      SET status = 'approved', approved_at = NOW(), updated_at = NOW()
      WHERE id = ${req.id}
    `;

    // Generate invoice number
    const invoiceCount = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM invoices
    `;
    const count = invoiceCount?.count ?? 0;
    const invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;

    // Create invoice from estimate
    const today = new Date().toISOString().split("T")[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const invoice = await db.queryRow<{ id: number }>`
      INSERT INTO invoices (
        customer_id, estimate_id, invoice_number, title, description,
        subtotal, tax_rate, tax_amount, total, amount_due,
        issue_date, due_date, notes
      )
      VALUES (
        ${estimate.customer_id}, ${req.id}, ${invoiceNumber},
        ${estimate.title}, ${estimate.description},
        ${estimate.subtotal}, ${estimate.tax_rate}, ${estimate.tax_amount}, ${estimate.total},
        ${estimate.total}, ${today}, ${dueDateStr}, ${estimate.notes}
      )
      RETURNING id
    `;

    if (!invoice) {
      throw new Error("Failed to create invoice");
    }

    // Copy line items from estimate to invoice
    await db.exec`
      INSERT INTO line_items (invoice_id, item_type, description, quantity, unit_price, total, sort_order)
      SELECT ${invoice.id}, item_type, description, quantity, unit_price, total, sort_order
      FROM line_items
      WHERE estimate_id = ${req.id}
    `;

    // Get updated estimate with line items
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

    return {
      estimate: {
        id: estimate.id,
        customerId: estimate.customer_id,
        estimateNumber: estimate.estimate_number,
        status: "approved" as const,
        title: estimate.title,
        description: estimate.description,
        subtotal: parseFloat(estimate.subtotal),
        taxRate: parseFloat(estimate.tax_rate),
        taxAmount: parseFloat(estimate.tax_amount),
        total: parseFloat(estimate.total),
        validUntil: estimate.valid_until,
        notes: estimate.notes,
        createdAt: estimate.created_at,
        updatedAt: new Date(),
        sentAt: estimate.sent_at,
        approvedAt: new Date(),
        lineItems: lineItemsArray.map((item) => ({
          id: item.id,
          itemType: item.item_type as "labor" | "material" | "other",
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unit_price),
          total: parseFloat(item.total),
          sortOrder: item.sort_order,
        })),
      },
      invoiceId: invoice.id,
    };
  }
);
