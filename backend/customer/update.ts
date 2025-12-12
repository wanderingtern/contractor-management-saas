import { api, APIError } from "encore.dev/api";
import db from "../db";
import type { Customer } from "./create";

export interface UpdateCustomerRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

// Updates an existing customer.
export const update = api<UpdateCustomerRequest, Customer>(
  { expose: true, method: "PUT", path: "/customers/:id" },
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
      UPDATE customers
      SET name = ${req.name},
          email = ${req.email},
          phone = ${req.phone},
          address = ${req.address},
          notes = ${req.notes ?? null}
      WHERE id = ${req.id}
      RETURNING id, name, email, phone, address, notes, created_at
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
