import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface DeleteCustomerRequest {
  id: number;
}

// Deletes a customer.
export const deleteCustomer = api<DeleteCustomerRequest, void>(
  { expose: true, method: "DELETE", path: "/customers/:id" },
  async (req) => {
    const result = await db.queryRow<{ count: number }>`
      DELETE FROM customers
      WHERE id = ${req.id}
      RETURNING 1 as count
    `;

    if (!result) {
      throw APIError.notFound("customer not found");
    }
  }
);
