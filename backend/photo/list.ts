import { api } from "encore.dev/api";
import db from "../db";
import type { Photo } from "./upload";

export interface ListPhotosRequest {
  customerId?: number;
  estimateId?: number;
  invoiceId?: number;
}

export interface ListPhotosResponse {
  photos: Photo[];
}

// List photos for a customer, estimate, or invoice
export const list = api<ListPhotosRequest, ListPhotosResponse>(
  { expose: true, method: "GET", path: "/photos" },
  async (req) => {
    // Build query based on filters
    let rows;

    if (req.customerId) {
      rows = await db.query<{
        id: number;
        url: string;
        storage_key: string;
        filename: string;
        mime_type: string;
        file_size: number;
        caption: string | null;
        customer_id: number | null;
        estimate_id: number | null;
        invoice_id: number | null;
        sort_order: number;
        created_at: Date;
      }>`
        SELECT id, url, storage_key, filename, mime_type, file_size, caption,
               customer_id, estimate_id, invoice_id, sort_order, created_at
        FROM photos
        WHERE customer_id = ${req.customerId}
        ORDER BY sort_order ASC, created_at DESC
      `;
    } else if (req.estimateId) {
      rows = await db.query<{
        id: number;
        url: string;
        storage_key: string;
        filename: string;
        mime_type: string;
        file_size: number;
        caption: string | null;
        customer_id: number | null;
        estimate_id: number | null;
        invoice_id: number | null;
        sort_order: number;
        created_at: Date;
      }>`
        SELECT id, url, storage_key, filename, mime_type, file_size, caption,
               customer_id, estimate_id, invoice_id, sort_order, created_at
        FROM photos
        WHERE estimate_id = ${req.estimateId}
        ORDER BY sort_order ASC, created_at DESC
      `;
    } else if (req.invoiceId) {
      rows = await db.query<{
        id: number;
        url: string;
        storage_key: string;
        filename: string;
        mime_type: string;
        file_size: number;
        caption: string | null;
        customer_id: number | null;
        estimate_id: number | null;
        invoice_id: number | null;
        sort_order: number;
        created_at: Date;
      }>`
        SELECT id, url, storage_key, filename, mime_type, file_size, caption,
               customer_id, estimate_id, invoice_id, sort_order, created_at
        FROM photos
        WHERE invoice_id = ${req.invoiceId}
        ORDER BY sort_order ASC, created_at DESC
      `;
    } else {
      rows = await db.query<{
        id: number;
        url: string;
        storage_key: string;
        filename: string;
        mime_type: string;
        file_size: number;
        caption: string | null;
        customer_id: number | null;
        estimate_id: number | null;
        invoice_id: number | null;
        sort_order: number;
        created_at: Date;
      }>`
        SELECT id, url, storage_key, filename, mime_type, file_size, caption,
               customer_id, estimate_id, invoice_id, sort_order, created_at
        FROM photos
        ORDER BY sort_order ASC, created_at DESC
      `;
    }

    // Convert async generator to array
    const rowsArray = [];
    for await (const row of rows) {
      rowsArray.push(row);
    }

    return {
      photos: rowsArray.map((row) => ({
        id: row.id,
        url: row.url,
        storageKey: row.storage_key,
        filename: row.filename,
        mimeType: row.mime_type,
        fileSize: row.file_size,
        caption: row.caption,
        customerId: row.customer_id,
        estimateId: row.estimate_id,
        invoiceId: row.invoice_id,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
      })),
    };
  }
);
