export interface LineItem {
  id?: number;
  itemType: "labor" | "material" | "other";
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sortOrder: number;
}

export interface Estimate {
  id: number;
  customerId: number;
  estimateNumber: string;
  status: "draft" | "sent" | "approved" | "rejected";
  title: string;
  description: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  sentAt: Date | null;
  approvedAt: Date | null;
  lineItems: LineItem[];
}
