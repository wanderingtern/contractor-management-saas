import { api } from "encore.dev/api";
import db from "../db";
import type { Customer } from "./create";

export interface ListCustomersResponse {
  customers: Customer[];
}

// Retrieves all customers, ordered by creation date (latest first).
export const list = api<void, ListCustomersResponse>(
  { expose: true, method: "GET", path: "/customers" },
  async () => {
    const customers: Customer[] = [];
    
    const rows = db.query<{
      id: number;
      name: string;
      email: string;
      phone: string;
      address: string;
      notes: string | null;
      created_at: Date;
    }>`
      SELECT id, name, email, phone, address, notes, created_at
      FROM customers
      ORDER BY created_at DESC
    `;

    for await (const row of rows) {
      customers.push({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        notes: row.notes,
        createdAt: row.created_at,
      });
    }

    return { customers };
  }
);
