import { api } from "encore.dev/api";
import db from "../db";

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string | null;
  createdAt: Date;
}

// Creates a new customer.
export const create = api<CreateCustomerRequest, Customer>(
  { expose: true, method: "POST", path: "/customers" },
  async (req) => {
    const row = await db.queryRow<{
      id: number;
      name: string;
      email: string;
      phone: string;
      address: string;
      notes: string | null;
      created_at: Date;
    }>`
      INSERT INTO customers (name, email, phone, address, notes)
      VALUES (${req.name}, ${req.email}, ${req.phone}, ${req.address}, ${req.notes ?? null})
      RETURNING id, name, email, phone, address, notes, created_at
    `;

    if (!row) {
      throw new Error("Failed to create customer");
    }

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
);
