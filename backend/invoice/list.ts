import { api } from "encore.dev/api";
import db from "../db";
import type { Invoice } from "./types";

export interface ListInvoicesRequest {
  customerId?: number;
  status?: "draft" | "sent" | "paid" | "overdue" | "cancelled";
}

export interface ListInvoicesResponse {
  invoices: Omit<Invoice, "lineItems">[];
}

// List invoices (optionally filtered by customer or status)
export const list = api<ListInvoicesRequest, ListInvoicesResponse>(
  { expose: true, method: "GET", path: "/invoices" },
  async (req) => {
    // Build query based on filters
    let rows;

    if (req.customerId && req.status) {
      rows = await db.query<{
        id: number;
        customer_id: number;
        estimate_id: number | null;
        invoice_number: string;
        status: string;
        title: string;
        description: string | null;
        subtotal: string;
        tax_rate: string;
        tax_amount: string;
        total: string;
        amount_paid: string;
        amount_due: string;
        issue_date: string;
        due_date: string;
        paid_date: Date | null;
        square_payment_id: string | null;
        payment_method: string | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
        sent_at: Date | null;
      }>`
        SELECT id, customer_id, estimate_id, invoice_number, status, title, description,
               subtotal, tax_rate, tax_amount, total, amount_paid, amount_due,
               issue_date, due_date, paid_date, square_payment_id, payment_method,
               notes, created_at, updated_at, sent_at
        FROM invoices
        WHERE customer_id = ${req.customerId} AND status = ${req.status}
        ORDER BY created_at DESC
      `;
    } else if (req.customerId) {
      rows = await db.query<{
        id: number;
        customer_id: number;
        estimate_id: number | null;
        invoice_number: string;
        status: string;
        title: string;
        description: string | null;
        subtotal: string;
        tax_rate: string;
        tax_amount: string;
        total: string;
        amount_paid: string;
        amount_due: string;
        issue_date: string;
        due_date: string;
        paid_date: Date | null;
        square_payment_id: string | null;
        payment_method: string | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
        sent_at: Date | null;
      }>`
        SELECT id, customer_id, estimate_id, invoice_number, status, title, description,
               subtotal, tax_rate, tax_amount, total, amount_paid, amount_due,
               issue_date, due_date, paid_date, square_payment_id, payment_method,
               notes, created_at, updated_at, sent_at
        FROM invoices
        WHERE customer_id = ${req.customerId}
        ORDER BY created_at DESC
      `;
    } else if (req.status) {
      rows = await db.query<{
        id: number;
        customer_id: number;
        estimate_id: number | null;
        invoice_number: string;
        status: string;
        title: string;
        description: string | null;
        subtotal: string;
        tax_rate: string;
        tax_amount: string;
        total: string;
        amount_paid: string;
        amount_due: string;
        issue_date: string;
        due_date: string;
        paid_date: Date | null;
        square_payment_id: string | null;
        payment_method: string | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
        sent_at: Date | null;
      }>`
        SELECT id, customer_id, estimate_id, invoice_number, status, title, description,
               subtotal, tax_rate, tax_amount, total, amount_paid, amount_due,
               issue_date, due_date, paid_date, square_payment_id, payment_method,
               notes, created_at, updated_at, sent_at
        FROM invoices
        WHERE status = ${req.status}
        ORDER BY created_at DESC
      `;
    } else {
      rows = await db.query<{
        id: number;
        customer_id: number;
        estimate_id: number | null;
        invoice_number: string;
        status: string;
        title: string;
        description: string | null;
        subtotal: string;
        tax_rate: string;
        tax_amount: string;
        total: string;
        amount_paid: string;
        amount_due: string;
        issue_date: string;
        due_date: string;
        paid_date: Date | null;
        square_payment_id: string | null;
        payment_method: string | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
        sent_at: Date | null;
      }>`
        SELECT id, customer_id, estimate_id, invoice_number, status, title, description,
               subtotal, tax_rate, tax_amount, total, amount_paid, amount_due,
               issue_date, due_date, paid_date, square_payment_id, payment_method,
               notes, created_at, updated_at, sent_at
        FROM invoices
        ORDER BY created_at DESC
      `;
    }

    // Convert async generator to array
    const rowsArray = [];
    for await (const row of rows) {
      rowsArray.push(row);
    }

    return {
      invoices: rowsArray.map((invoice) => ({
        id: invoice.id,
        customerId: invoice.customer_id,
        estimateId: invoice.estimate_id,
        invoiceNumber: invoice.invoice_number,
        status: invoice.status as "draft" | "sent" | "paid" | "overdue" | "cancelled",
        title: invoice.title,
        description: invoice.description,
        subtotal: parseFloat(invoice.subtotal),
        taxRate: parseFloat(invoice.tax_rate),
        taxAmount: parseFloat(invoice.tax_amount),
        total: parseFloat(invoice.total),
        amountPaid: parseFloat(invoice.amount_paid),
        amountDue: parseFloat(invoice.amount_due),
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        paidDate: invoice.paid_date,
        squarePaymentId: invoice.square_payment_id,
        paymentMethod: invoice.payment_method,
        notes: invoice.notes,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        sentAt: invoice.sent_at,
        lineItems: [], // Not included in list view
      })),
    };
  }
);
