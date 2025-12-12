import { api } from "encore.dev/api";
import db from "../db";
import type { Invoice } from "./types";
import type { LineItem } from "../estimate/types";

export interface GetInvoiceRequest {
  id: number;
}

// Get a single invoice with line items
export const get = api<GetInvoiceRequest, Invoice>(
  { expose: true, method: "GET", path: "/invoices/:id" },
  async (req) => {
    const invoice = await db.queryRow<{
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
      WHERE id = ${req.id}
    `;

    if (!invoice) {
      throw new Error("Invoice not found");
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
      WHERE invoice_id = ${req.id}
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
      lineItems,
    };
  }
);
