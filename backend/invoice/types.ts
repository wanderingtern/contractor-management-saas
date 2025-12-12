import type { LineItem } from "../estimate/types";

export interface Invoice {
  id: number;
  customerId: number;
  estimateId: number | null;
  invoiceNumber: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  title: string;
  description: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  issueDate: string;
  dueDate: string;
  paidDate: Date | null;
  squarePaymentId: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  sentAt: Date | null;
  lineItems: LineItem[];
}
