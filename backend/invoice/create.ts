import { api } from "encore.dev/api";
import db from "../db";
import type { Invoice } from "./types";
import type { LineItem } from "../estimate/types";

export interface CreateInvoiceRequest {
  customerId: number;
  estimateId?: number;
  title: string;
  description?: string;
  taxRate?: number;
  issueDate?: string; // ISO date string
  dueDate?: string; // ISO date string
  notes?: string;
  lineItems: Omit<LineItem, "id">[];
}

// Generate invoice number
async function generateInvoiceNumber(): Promise<string> {
  const result = await db.queryRow<{ count: number }>`
    SELECT COUNT(*) as count FROM invoices
  `;
  const count = result?.count ?? 0;
  return `INV-${String(count + 1).padStart(5, "0")}`;
}

// Creates a new invoice with line items
export const create = api<CreateInvoiceRequest, Invoice>(
  { expose: true, method: "POST", path: "/invoices" },
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

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Default dates
    const today = new Date().toISOString().split("T")[0];
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    const dueDateStr = defaultDueDate.toISOString().split("T")[0];

    // Create invoice
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
      INSERT INTO invoices (
        customer_id, estimate_id, invoice_number, title, description,
        subtotal, tax_rate, tax_amount, total, amount_due,
        issue_date, due_date, notes
      )
      VALUES (
        ${req.customerId}, ${req.estimateId ?? null}, ${invoiceNumber},
        ${req.title}, ${req.description ?? null},
        ${subtotal}, ${taxRate}, ${taxAmount}, ${total}, ${total},
        ${req.issueDate ?? today}, ${req.dueDate ?? dueDateStr}, ${req.notes ?? null}
      )
      RETURNING id, customer_id, estimate_id, invoice_number, status, title, description,
                subtotal, tax_rate, tax_amount, total, amount_paid, amount_due,
                issue_date, due_date, paid_date, square_payment_id, payment_method,
                notes, created_at, updated_at, sent_at
    `;

    if (!invoice) {
      throw new Error("Failed to create invoice");
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
          invoice_id, item_type, description, quantity, unit_price, total, sort_order
        )
        VALUES (
          ${invoice.id}, ${item.itemType}, ${item.description},
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
