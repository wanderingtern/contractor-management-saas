import { api, APIError } from "encore.dev/api";
import db from "../db";
import type { Customer } from "./create";

export interface GetCustomerRequest {
  id: number;
}

// Retrieves a single customer by ID.
export const get = api<GetCustomerRequest, Customer>(
  { expose: true, method: "GET", path: "/customers/:id" },
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
      SELECT id, name, email, phone, address, notes, created_at
      FROM customers
      WHERE id = ${req.id}
    `;

    if (!row) {
      throw APIError.notFound("customer not found");
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
