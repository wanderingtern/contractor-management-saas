import { api } from "encore.dev/api";
import db from "../db";
import type { Invoice } from "./types";

export interface RecordPaymentRequest {
  id: number;
  amount: number;
  paymentMethod: string;
  squarePaymentId?: string;
}

export interface RecordPaymentResponse {
  invoice: Omit<Invoice, "lineItems">;
}

// Record a payment for an invoice (Square integration goes here)
export const recordPayment = api<RecordPaymentRequest, RecordPaymentResponse>(
  { expose: true, method: "POST", path: "/invoices/:id/payment" },
  async (req) => {
    // Get invoice
    const existing = await db.queryRow<{
      status: string;
      total: string;
      amount_paid: string;
      amount_due: string;
    }>`
      SELECT status, total, amount_paid, amount_due
      FROM invoices
      WHERE id = ${req.id}
    `;

    if (!existing) {
      throw new Error("Invoice not found");
    }

    if (existing.status === "paid") {
      throw new Error("Invoice already paid");
    }

    const currentAmountPaid = parseFloat(existing.amount_paid);
    const total = parseFloat(existing.total);
    const newAmountPaid = currentAmountPaid + req.amount;
    const newAmountDue = total - newAmountPaid;

    // Determine new status
    const newStatus = newAmountDue <= 0 ? "paid" : "sent";
    const paidDate = newAmountDue <= 0 ? new Date() : null;

    // Update invoice with payment info
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
      UPDATE invoices
      SET
        status = ${newStatus},
        amount_paid = ${newAmountPaid},
        amount_due = ${newAmountDue},
        paid_date = ${paidDate},
        square_payment_id = ${req.squarePaymentId ?? null},
        payment_method = ${req.paymentMethod},
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, customer_id, estimate_id, invoice_number, status, title, description,
                subtotal, tax_rate, tax_amount, total, amount_paid, amount_due,
                issue_date, due_date, paid_date, square_payment_id, payment_method,
                notes, created_at, updated_at, sent_at
    `;

    if (!invoice) {
      throw new Error("Failed to record payment");
    }

    return {
      invoice: {
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
        lineItems: [],
      },
    };
  }
);

// TODO: Integrate with Square Payment API
// This endpoint will need to:
// 1. Create a payment link with Square SDK
// 2. Handle webhooks for payment confirmation
// 3. Update invoice status when payment completes
