import { api } from "encore.dev/api";
import db from "../db";
import type { Estimate } from "./types";

export interface ListEstimatesRequest {
  customerId?: number;
  status?: "draft" | "sent" | "approved" | "rejected";
}

export interface ListEstimatesResponse {
  estimates: Omit<Estimate, "lineItems">[];
}

// List estimates (optionally filtered by customer or status)
export const list = api<ListEstimatesRequest, ListEstimatesResponse>(
  { expose: true, method: "GET", path: "/estimates" },
  async (req) => {
    // Build query based on filters
    let rows;

    if (req.customerId && req.status) {
      rows = await db.query<{
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
        WHERE customer_id = ${req.customerId} AND status = ${req.status}
        ORDER BY created_at DESC
      `;
    } else if (req.customerId) {
      rows = await db.query<{
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
        WHERE customer_id = ${req.customerId}
        ORDER BY created_at DESC
      `;
    } else if (req.status) {
      rows = await db.query<{
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
        WHERE status = ${req.status}
        ORDER BY created_at DESC
      `;
    } else {
      rows = await db.query<{
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
        ORDER BY created_at DESC
      `;
    }

    // Convert async generator to array
    const rowsArray = [];
    for await (const row of rows) {
      rowsArray.push(row);
    }

    return {
      estimates: rowsArray.map((estimate) => ({
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
        lineItems: [], // Not included in list view
      })),
    };
  }
);
