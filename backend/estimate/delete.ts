import { api } from "encore.dev/api";
import db from "../db";

export interface DeleteEstimateRequest {
  id: number;
}

export interface DeleteEstimateResponse {
  success: boolean;
}

// Delete an estimate (only if not approved)
export const deleteEstimate = api<DeleteEstimateRequest, DeleteEstimateResponse>(
  { expose: true, method: "DELETE", path: "/estimates/:id" },
  async (req) => {
    // Check if estimate exists and is not approved
    const estimate = await db.queryRow<{ status: string }>`
      SELECT status FROM estimates WHERE id = ${req.id}
    `;

    if (!estimate) {
      throw new Error("Estimate not found");
    }

    if (estimate.status === "approved") {
      throw new Error("Cannot delete approved estimate");
    }

    // Delete estimate (line items will cascade)
    await db.exec`DELETE FROM estimates WHERE id = ${req.id}`;

    return { success: true };
  }
);
