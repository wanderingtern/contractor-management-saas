import { api } from "encore.dev/api";
import db from "../db";

export interface DeleteInvoiceRequest {
  id: number;
}

export interface DeleteInvoiceResponse {
  success: boolean;
}

// Delete an invoice (only if not paid)
export const deleteInvoice = api<DeleteInvoiceRequest, DeleteInvoiceResponse>(
  { expose: true, method: "DELETE", path: "/invoices/:id" },
  async (req) => {
    // Check if invoice exists and is not paid
    const invoice = await db.queryRow<{ status: string }>`
      SELECT status FROM invoices WHERE id = ${req.id}
    `;

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status === "paid") {
      throw new Error("Cannot delete paid invoice");
    }

    // Delete invoice (line items will cascade)
    await db.exec`DELETE FROM invoices WHERE id = ${req.id}`;

    return { success: true };
  }
);
