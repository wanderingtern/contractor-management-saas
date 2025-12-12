import { api } from "encore.dev/api";
import db from "../db";
import type { Estimate, LineItem } from "./types";

export interface GetEstimateRequest {
  id: number;
}

// Get a single estimate with line items
export const get = api<GetEstimateRequest, Estimate>(
  { expose: true, method: "GET", path: "/estimates/:id" },
  async (req) => {
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
